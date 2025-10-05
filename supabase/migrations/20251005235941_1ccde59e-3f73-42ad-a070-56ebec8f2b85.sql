-- Security hardening for SECURITY DEFINER analytics functions
-- Functions remain postgres-owned but with restricted access

-- 1) Revoke PUBLIC execute permissions - only authenticated users can call these
REVOKE ALL ON FUNCTION public.fn_consensus_prob_at(timestamptz, text, text, text, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_momentum_surge(timestamptz, int, int, int) FROM PUBLIC;

-- 2) Grant execute only to authenticated users
GRANT EXECUTE ON FUNCTION public.fn_consensus_prob_at(timestamptz, text, text, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_momentum_surge(timestamptz, int, int, int) TO authenticated;

-- 3) Document security intent
COMMENT ON FUNCTION public.fn_consensus_prob_at(timestamptz, text, text, text, numeric) 
  IS 'SECURITY DEFINER read-only analytics. Pinned search_path=public. Returns aggregated market consensus only. No PII exposure. No dynamic SQL.';

COMMENT ON FUNCTION public.fn_momentum_surge(timestamptz, int, int, int) 
  IS 'SECURITY DEFINER read-only analytics. Detects rapid consensus moves vs lagging books. Pinned search_path=public. No dynamic SQL. No PII exposure. Uses temp tables for isolated session state.';