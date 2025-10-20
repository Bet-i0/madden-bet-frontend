-- Enable RLS on edge_function_metrics
ALTER TABLE edge_function_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY edge_metrics_admin_only ON edge_function_metrics FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));