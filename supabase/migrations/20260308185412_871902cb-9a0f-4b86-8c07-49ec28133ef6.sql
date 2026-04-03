UPDATE public.profiles 
SET 
  user_tier = 'free',
  stripe_customer_id = NULL,
  stripe_subscription_id = NULL,
  subscription_end_date = NULL,
  cancel_at_period_end = false
WHERE user_id = '527c8e63-6d90-4ae5-a0bc-d218dddacd67';

DELETE FROM public.chat_access WHERE user_id = '527c8e63-6d90-4ae5-a0bc-d218dddacd67';