import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildUrl, fetchJSON, assertApiKey } from './endpointManifest.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type League = 'nfl' | 'cfb';
type Status = 'out' | 'doubtful' | 'questionable' | 'probable' | 'active' | 'limited';

const STATUS_MAP: Record<string, Status> = {
  Out: 'out',
  Inactive: 'out',
  Doubtful: 'doubtful',
  Questionable: 'questionable',
  Probable: 'probable',
  Active: 'active',
  'Did Not Practice': 'limited',
  Limited: 'limited',
  Full: 'active'
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const API_KEY = assertApiKey();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const MODE = Deno.env.get('BETIO_INGEST_MODE') ?? 'staging';
    const IN_SEASON = (Deno.env.get('BETIO_IN_SEASON') ?? 'true') === 'true';
    const dateISO = new Date().toISOString().slice(0, 10);

    const LEAGUES: League[] = ['nfl', 'cfb'];
    let totalInserted = 0;
    const errors: string[] = [];

    console.log(`[${requestId}] Starting ingest: MODE=${MODE}, IN_SEASON=${IN_SEASON}, date=${dateISO}`);

    for (const league of LEAGUES) {
      const leagueUpper = league === 'nfl' ? 'NFL' : 'NCAAF';

      try {
        // TEAMS → provider_team_map
        const teams: any[] = await fetchJSON(buildUrl(league, 'teams'), API_KEY);
        console.log(`[${requestId}] Fetched ${teams.length} teams for ${leagueUpper}`);

        for (const t of teams) {
          const provider_team_id = String(t.TeamID ?? t.TeamId ?? t.GlobalTeamID ?? t.GlobalTeamId ?? '');
          if (!provider_team_id) continue;

          await supabase.from('provider_team_map').upsert(
            { provider: 'sportsdataio', provider_team_id, team_id: null },
            { onConflict: 'provider,provider_team_id' }
          );
        }

        // GAMES → provider_game_map
        const games: any[] = await fetchJSON(buildUrl(league, 'gamesByDate', { date: dateISO }), API_KEY);
        console.log(`[${requestId}] Fetched ${games.length} games for ${leagueUpper}`);

        for (const g of games) {
          const provider_game_id = String(g.GameID ?? g.GameId ?? g.GlobalGameID ?? '');
          if (!provider_game_id) continue;

          await supabase.from('provider_game_map').upsert(
            { provider: 'sportsdataio', provider_game_id, game_id: null },
            { onConflict: 'provider,provider_game_id' }
          );
        }

        // DEPTH CHARTS → depth_chart_events
        const depthCharts: any[] = await fetchJSON(buildUrl(league, 'depthChartsByDate', { date: dateISO }), API_KEY);
        console.log(`[${requestId}] Fetched ${depthCharts.length} depth chart entries for ${leagueUpper}`);

        for (const row of depthCharts) {
          const provider_team_id = String(row.TeamID ?? row.TeamId ?? row.GlobalTeamID ?? '');
          if (!provider_team_id) continue;

          // Get team UUID
          const { data: teamMap } = await supabase
            .from('provider_team_map')
            .select('team_id')
            .eq('provider', 'sportsdataio')
            .eq('provider_team_id', provider_team_id)
            .maybeSingle();
          const team_id = teamMap?.team_id ?? null;

          // Extract depth chart entries for each position
          const entries: Array<{ position: string; rank: number; player: any }> = [];
          for (const pos of ['QB', 'RB', 'WR', 'TE']) {
            const starters = row[`${pos}DepthChart`] ?? row[pos] ?? [];
            starters.forEach((p: any, idx: number) => entries.push({ position: pos, rank: idx + 1, player: p }));
          }

          for (const e of entries) {
            const provider_player_id = String(e.player.PlayerID ?? e.player.PlayerId ?? e.player.GlobalPlayerID ?? '');
            if (!provider_player_id) continue;

            // Get or create player
            let player_id: string | null = null;
            const { data: playerMap } = await supabase
              .from('provider_player_map')
              .select('player_id')
              .eq('provider', 'sportsdataio')
              .eq('provider_player_id', provider_player_id)
              .maybeSingle();

            if (playerMap?.player_id) {
              player_id = playerMap.player_id;
            } else {
              const name = ((e.player.Name ?? `${e.player.FirstName ?? ''} ${e.player.LastName ?? ''}`) || 'Unknown').trim();
              const { data: p } = await supabase
                .from('players')
                .insert({
                  provider: 'sportsdataio',
                  provider_player_id,
                  name,
                  position: e.position,
                  league: leagueUpper,
                })
                .select('id')
                .single();
              player_id = p?.id ?? null;
              if (player_id) {
                await supabase.from('provider_player_map').upsert({
                  provider: 'sportsdataio',
                  provider_player_id,
                  player_id,
                });
              }
            }

            // Insert depth chart event
            await supabase.from('depth_chart_events').insert({
              provider: 'sportsdataio',
              provider_team_id,
              team_id,
              position: e.position,
              rank: e.rank,
              provider_player_id,
              player_id,
              captured_at: new Date().toISOString(),
              source: e.player,
            });
            totalInserted++;
          }
        }

        // INJURIES → injury_events, player_status
        const injuries: any[] = await fetchJSON(buildUrl(league, 'injuriesByDate', { date: dateISO }), API_KEY);
        console.log(`[${requestId}] Fetched ${injuries.length} injuries for ${leagueUpper}`);

        for (const ev of injuries) {
          const provider_player_id = String(ev.PlayerID ?? ev.PlayerId ?? ev.GlobalPlayerID ?? ev.GlobalPlayerId ?? '');
          if (!provider_player_id) continue;

          const rawStatus = String(ev.InjuryStatus ?? ev.PracticeStatus ?? ev.Status ?? 'Active');
          const status: Status = STATUS_MAP[rawStatus] || 'active';
          const first = ev.FirstName ?? '';
          const last = ev.LastName ?? '';
          const name = ((ev.Name ?? `${first} ${last}`) || 'Unknown').trim();
          const position = String(ev.Position ?? '');

          // Get or create player
          let player_id: string | null = null;
          const { data: mapRow } = await supabase
            .from('provider_player_map')
            .select('player_id')
            .eq('provider', 'sportsdataio')
            .eq('provider_player_id', provider_player_id)
            .maybeSingle();

          if (mapRow?.player_id) {
            player_id = mapRow.player_id;
          } else {
            const { data: p } = await supabase
              .from('players')
              .insert({
                provider: 'sportsdataio',
                provider_player_id,
                name,
                position,
                league: leagueUpper,
              })
              .select('id')
              .single();
            player_id = p?.id ?? null;
            if (player_id) {
              await supabase.from('provider_player_map').upsert({
                provider: 'sportsdataio',
                provider_player_id,
                player_id,
              });
            }
          }

          let game_id: string | null = null;
          const provider_game_id = String(ev.GameID ?? ev.GameId ?? '');
          if (provider_game_id) {
            const { data: gm } = await supabase
              .from('provider_game_map')
              .select('game_id')
              .eq('provider', 'sportsdataio')
              .eq('provider_game_id', provider_game_id)
              .maybeSingle();
            game_id = gm?.game_id ?? null;
          }

          // Insert injury event
          await supabase.from('injury_events').insert({
            provider: 'sportsdataio',
            provider_player_id,
            player_id,
            game_id,
            status,
            body_part: ev.InjuryBodyPart ?? ev.BodyPart ?? null,
            severity: ev.InjuryNotes ?? ev.PracticeDescription ?? null,
            report_time: new Date().toISOString(),
            source: ev,
          });
          totalInserted++;

          // Update player status
          if (player_id) {
            await supabase.from('player_status').upsert(
              {
                player_id,
                status,
                body_part: ev.InjuryBodyPart ?? ev.BodyPart ?? null,
                severity: ev.InjuryNotes ?? ev.PracticeDescription ?? null,
                last_updated: new Date().toISOString(),
              },
              { onConflict: 'player_id' }
            );
          }
        }
      } catch (leagueError) {
        console.error(`[${requestId}] Error processing ${leagueUpper}:`, leagueError);
        errors.push(`${leagueUpper}: ${leagueError.message}`);
      }
    }

    const duration = Date.now() - startTime;

    // Log to ingest_runs
    await supabase.from('ingest_runs').insert({
      function: 'sportsdataio-ingest',
      sport: 'multi',
      success: errors.length === 0,
      rows_inserted: totalInserted,
      duration_ms: duration,
      error: errors.length > 0 ? errors.join('; ') : null,
    });

    console.log(`[${requestId}] Completed in ${duration}ms: ${totalInserted} rows inserted`);

    return new Response(
      JSON.stringify({
        ok: true,
        requestId,
        totalInserted,
        duration,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[${requestId}] Fatal error:`, error);
    return new Response(
      JSON.stringify({
        code: 'sportsdataio.ingest.failed',
        message: 'Could not ingest injuries/depth charts',
        details: { reason: String(error) },
        requestId,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
