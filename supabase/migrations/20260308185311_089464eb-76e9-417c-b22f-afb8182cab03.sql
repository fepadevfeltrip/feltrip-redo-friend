UPDATE public.profiles 
SET 
  user_tier = 'premium_company',
  stripe_customer_id = 'cus_U70LbCVz0Vl15B',
  stripe_subscription_id = 'sub_1T8mMLA1KiGIrxAcogvIXugX',
  cancel_at_period_end = false
WHERE user_id = '527c8e63-6d90-4ae5-a0bc-d218dddacd67';

INSERT INTO public.chat_access (user_id, plan_type, expires_at)
VALUES (
  '527c8e63-6d90-4ae5-a0bc-d218dddacd67',
  'explorer',
  now() + interval '30 days'
);