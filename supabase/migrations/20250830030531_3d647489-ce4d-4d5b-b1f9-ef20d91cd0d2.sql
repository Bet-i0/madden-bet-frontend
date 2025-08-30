-- Update free plan to have more reasonable limits for testing
UPDATE subscription_plans 
SET ai_calls_per_month = 50 
WHERE name = 'Free';

-- Check current user and ensure they have a subscription
DO $$
DECLARE
    current_user_id UUID;
    free_plan_id UUID;
BEGIN
    -- Get the current authenticated user
    SELECT auth.uid() INTO current_user_id;
    
    -- Get the free plan ID
    SELECT id INTO free_plan_id 
    FROM subscription_plans 
    WHERE name = 'Free' AND is_active = true;
    
    -- Create subscription for current user if they don't have one
    IF current_user_id IS NOT NULL AND free_plan_id IS NOT NULL THEN
        INSERT INTO user_subscriptions (user_id, plan_id, is_active)
        VALUES (current_user_id, free_plan_id, true)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;