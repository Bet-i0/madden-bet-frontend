import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Target, Zap, DollarSign } from 'lucide-react';
import BackToHome from '@/components/BackToHome';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import LoadingFallback from '@/components/LoadingFallback';

export default function SuccessMetrics() {
  const { isAdmin, loading: roleLoading } = useUserRole();

  const { data: socialMetrics } = useQuery({
    queryKey: ['social-engagement-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_engagement_metrics')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: clvMetrics } = useQuery({
    queryKey: ['clv-capture-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clv_capture_metrics')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: conversionMetrics } = useQuery({
    queryKey: ['tier-conversion-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tier_conversion_metrics')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: edgeMetrics } = useQuery({
    queryKey: ['edge-function-p95-latency'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edge_function_p95_latency')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: aiSpend } = useQuery({
    queryKey: ['ai-spend-per-user'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_usage_by_user')
        .select('*');
      if (error) throw error;
      
      const totalUsers = data?.length || 1;
      const totalCost = data?.reduce((sum, u) => sum + (Number(u.total_cost) || 0), 0) || 0;
      return {
        avgCostPerUser: totalCost / totalUsers,
        totalCost,
        totalUsers
      };
    },
  });

  if (roleLoading) {
    return <LoadingFallback />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const getMetricStatus = (value: number, target: number, higherIsBetter: boolean = true) => {
    const ratio = value / target;
    if (higherIsBetter) {
      if (ratio >= 1) return 'success';
      if (ratio >= 0.8) return 'warning';
      return 'danger';
    } else {
      if (ratio <= 1) return 'success';
      if (ratio <= 1.2) return 'warning';
      return 'danger';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      warning: 'secondary',
      danger: 'destructive'
    } as const;
    const labels = {
      success: '✓ On Track',
      warning: '⚠ At Risk',
      danger: '✗ Below Target'
    };
    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>;
  };

  const avgReactions = Number(socialMetrics?.avg_reactions_per_bet) || 0;
  const clvCaptureRate = Number(clvMetrics?.clv_capture_rate_percent) || 0;
  const conversionRate = Number(conversionMetrics?.conversion_rate_percent) || 0;
  const avgP95Latency = edgeMetrics?.reduce((sum, m) => sum + (Number(m.p95_latency_ms) || 0), 0) / (edgeMetrics?.length || 1);
  const costPerUser = aiSpend?.avgCostPerUser || 0;

  return (
    <div className="container mx-auto p-6 pb-24 max-w-7xl">
      <BackToHome />
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Success Metrics Dashboard</h1>
        <p className="text-muted-foreground">Track key performance indicators</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Social Engagement */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Social Engagement</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Avg reactions per shared bet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold">{avgReactions.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Target: &gt; 2.0</p>
              </div>
              <div>
                {getStatusBadge(getMetricStatus(avgReactions, 2, true))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CLV Capture Rate */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">CLV Capture Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Bets with closing line value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold">{clvCaptureRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Target: 100%</p>
              </div>
              <div>
                {getStatusBadge(getMetricStatus(clvCaptureRate, 100, true))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier Conversion */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Tier Conversion</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Upgrades within 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold">{conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {conversionMetrics?.upgraded_within_30_days || 0} / {conversionMetrics?.starter_users || 0} users
                </p>
              </div>
              <div>
                {getStatusBadge(getMetricStatus(conversionRate, 5, true))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edge Function Latency */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">P95 Latency</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Avg across all edge functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold">{avgP95Latency.toFixed(0)}ms</div>
                <p className="text-xs text-muted-foreground mt-1">Target: &lt; 500ms</p>
              </div>
              <div>
                {getStatusBadge(getMetricStatus(avgP95Latency, 500, false))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Spend Per User */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">AI Cost Per User</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Monthly average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold">${costPerUser.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Target: &lt; $2.00</p>
              </div>
              <div>
                {getStatusBadge(getMetricStatus(costPerUser, 2, false))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Edge Function Performance</CardTitle>
            <CardDescription>P95 latency by function (24h)</CardDescription>
          </CardHeader>
          <CardContent>
            {edgeMetrics && edgeMetrics.length > 0 ? (
              <div className="space-y-2">
                {edgeMetrics.map((metric, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div className="font-mono text-sm">{metric.function_name}</div>
                    <div className="flex gap-4 text-sm">
                      <span className={Number(metric.p95_latency_ms) > 500 ? 'text-red-500' : 'text-green-500'}>
                        {Number(metric.p95_latency_ms).toFixed(0)}ms
                      </span>
                      <span className="text-muted-foreground">
                        {metric.request_count} reqs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No latency data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Current tier breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Starter</span>
                <span className="text-2xl font-bold">{conversionMetrics?.starter_users || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pro</span>
                <span className="text-2xl font-bold text-blue-500">{conversionMetrics?.pro_users || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Degenerate</span>
                <span className="text-2xl font-bold text-purple-500">{conversionMetrics?.degenerate_users || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
