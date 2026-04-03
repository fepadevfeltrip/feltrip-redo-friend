-- Create user credits table
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  credits_balance integer NOT NULL DEFAULT 0,
  total_credits_purchased integer NOT NULL DEFAULT 0,
  total_credits_used integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create credits transactions table for history
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')),
  description text,
  ai_function text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for user_credits
CREATE POLICY "Users can view their own credits"
ON public.user_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert credits"
ON public.user_credits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update credits"
ON public.user_credits FOR UPDATE
USING (auth.uid() = user_id);

-- Policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
ON public.credit_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
ON public.credit_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Managers can view all credits (for admin purposes)
CREATE POLICY "Managers can view all credits"
ON public.user_credits FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can update credits"
ON public.user_credits FOR UPDATE
USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can view all transactions"
ON public.credit_transactions FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));

-- Function to deduct credits
CREATE OR REPLACE FUNCTION public.use_ai_credit(
  p_user_id uuid,
  p_amount integer DEFAULT 1,
  p_ai_function text DEFAULT 'ai_call'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
BEGIN
  -- Get current balance
  SELECT credits_balance INTO current_balance
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no record exists, create one with 0 balance
  IF NOT FOUND THEN
    INSERT INTO public.user_credits (user_id, credits_balance)
    VALUES (p_user_id, 0);
    current_balance := 0;
  END IF;

  -- Check if enough credits
  IF current_balance < p_amount THEN
    RETURN false;
  END IF;

  -- Deduct credits
  UPDATE public.user_credits
  SET 
    credits_balance = credits_balance - p_amount,
    total_credits_used = total_credits_used + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description, ai_function)
  VALUES (p_user_id, -p_amount, 'usage', 'AI usage', p_ai_function);

  RETURN true;
END;
$$;

-- Function to add credits
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text DEFAULT 'purchase',
  p_description text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
  -- Insert or update credits
  INSERT INTO public.user_credits (user_id, credits_balance, total_credits_purchased)
  VALUES (p_user_id, p_amount, CASE WHEN p_type = 'purchase' THEN p_amount ELSE 0 END)
  ON CONFLICT (user_id) DO UPDATE SET
    credits_balance = user_credits.credits_balance + p_amount,
    total_credits_purchased = user_credits.total_credits_purchased + 
      CASE WHEN p_type = 'purchase' THEN p_amount ELSE 0 END,
    updated_at = now()
  RETURNING credits_balance INTO new_balance;

  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, p_type, p_description);

  RETURN new_balance;
END;
$$;

-- Create trigger to give initial credits to new users
CREATE OR REPLACE FUNCTION public.give_initial_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_balance, total_credits_purchased)
  VALUES (NEW.id, 50, 0); -- 50 créditos gratuitos iniciais
  
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 50, 'bonus', 'Créditos de boas-vindas');
  
  RETURN NEW;
END;
$$;

-- Trigger for new users
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.give_initial_credits();

-- Update timestamp trigger
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();