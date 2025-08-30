-- Add unique constraint to prevent duplicate subscriptions per user
ALTER TABLE user_subscriptions 
ADD CONSTRAINT user_subscriptions_user_id_unique UNIQUE (user_id);

-- Insert subscription for current user
INSERT INTO user_subscriptions (user_id, plan_id, is_active)
SELECT 
    'dc9bb10b-e4a7-4825-b7cb-88b5c60931f2'::uuid as user_id,
    id as plan_id,
    true as is_active
FROM subscription_plans 
WHERE name = 'Free' AND is_active = true
ON CONFLICT (user_id) DO NOTHING;