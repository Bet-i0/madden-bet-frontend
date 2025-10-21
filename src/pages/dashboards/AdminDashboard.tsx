import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { TriggerSportsDataIOIngest } from '@/components/TriggerSportsDataIOIngest';

export default function AdminDashboard() {
  const { data: aiUsage } = useQuery({
    queryKey: ['admin-ai-usage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_usage_by_user')
        .select('*')
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: oddsHealth } = useQuery({
    queryKey: ['admin-odds-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('odds_ingestion_health')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: ingestRuns } = useQuery({
    queryKey: ['admin-ingest-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingest_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto p-6 pb-24 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">System health and operations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Total AI Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${aiUsage?.reduce((sum, u) => sum + (Number(u.total_cost) || 0), 0).toFixed(2) ?? '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Total Tokens</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((aiUsage?.reduce((sum, u) => sum + (Number(u.total_tokens) || 0), 0) ?? 0) / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Odds Rows/Hour</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {oddsHealth?.reduce((sum, o) => sum + (o.rows_last_hour || 0), 0) ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all sports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Failed Runs</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {ingestRuns?.filter(r => !r.success).length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 10 runs</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <TriggerSportsDataIOIngest />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>AI Usage by User</CardTitle>
            <CardDescription>Top 10 users by cost (last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {aiUsage && aiUsage.length > 0 ? (
              <div className="space-y-2">
                {aiUsage.map((usage, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div className="text-sm font-mono">{usage.user_id?.slice(0, 8)}...</div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">{usage.call_count} calls</span>
                      <span className="font-semibold">${Number(usage.total_cost).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No AI usage data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Odds Ingestion Health</CardTitle>
            <CardDescription>Last snapshot per sport</CardDescription>
          </CardHeader>
          <CardContent>
            {oddsHealth && oddsHealth.length > 0 ? (
              <div className="space-y-2">
                {oddsHealth.map((health, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <div className="font-semibold">{health.sport}</div>
                      <div className="text-xs text-muted-foreground">
                        {health.active_books} active books
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {health.last_snapshot ? format(new Date(health.last_snapshot), 'HH:mm:ss') : 'Never'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No odds data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Ingest Runs</CardTitle>
          <CardDescription>Last 10 odds ingestion attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {ingestRuns && ingestRuns.length > 0 ? (
            <div className="space-y-2">
              {ingestRuns.map((run) => (
                <div key={run.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <div className="font-semibold">{run.function}</div>
                    <div className="text-xs text-muted-foreground">
                      {run.sport} • {run.rows_inserted} rows • {run.duration_ms}ms
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${run.success ? 'text-green-500' : 'text-red-500'}`}>
                      {run.success ? 'Success' : 'Failed'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(run.created_at), 'HH:mm:ss')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No ingest runs found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
