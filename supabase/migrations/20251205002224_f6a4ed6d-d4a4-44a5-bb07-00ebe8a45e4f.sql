-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption function using AES-256
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(plain_text text, encryption_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN plain_text;
  END IF;
  RETURN encode(
    pgp_sym_encrypt(plain_text, encryption_key, 'cipher-algo=aes256'),
    'base64'
  );
END;
$$;

-- Create decryption function
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_text text, encryption_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF encrypted_text IS NULL OR encrypted_text = '' THEN
    RETURN encrypted_text;
  END IF;
  BEGIN
    RETURN pgp_sym_decrypt(
      decode(encrypted_text, 'base64'),
      encryption_key
    );
  EXCEPTION WHEN OTHERS THEN
    -- Return original if decryption fails (data might not be encrypted)
    RETURN encrypted_text;
  END;
END;
$$;

-- Add encrypted columns to tables (keeping original columns for migration)
-- private_messages
ALTER TABLE public.private_messages ADD COLUMN IF NOT EXISTS content_encrypted text;

-- diary_entries
ALTER TABLE public.diary_entries ADD COLUMN IF NOT EXISTS note_encrypted text;

-- travel_documents
ALTER TABLE public.travel_documents ADD COLUMN IF NOT EXISTS name_encrypted text;
ALTER TABLE public.travel_documents ADD COLUMN IF NOT EXISTS notes_encrypted text;
ALTER TABLE public.travel_documents ADD COLUMN IF NOT EXISTS link_encrypted text;

-- user_annotations
ALTER TABLE public.user_annotations ADD COLUMN IF NOT EXISTS title_encrypted text;
ALTER TABLE public.user_annotations ADD COLUMN IF NOT EXISTS content_encrypted text;
ALTER TABLE public.user_annotations ADD COLUMN IF NOT EXISTS link_encrypted text;

-- community_events
ALTER TABLE public.community_events ADD COLUMN IF NOT EXISTS title_encrypted text;
ALTER TABLE public.community_events ADD COLUMN IF NOT EXISTS description_encrypted text;
ALTER TABLE public.community_events ADD COLUMN IF NOT EXISTS location_encrypted text;

-- community_posts
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS content_encrypted text;

-- map_pins
ALTER TABLE public.map_pins ADD COLUMN IF NOT EXISTS title_encrypted text;
ALTER TABLE public.map_pins ADD COLUMN IF NOT EXISTS content_encrypted text;

-- map_pin_comments
ALTER TABLE public.map_pin_comments ADD COLUMN IF NOT EXISTS content_encrypted text;

-- presence_questionnaires
ALTER TABLE public.presence_questionnaires ADD COLUMN IF NOT EXISTS poetic_response_encrypted text;

-- profiles (for sensitive name/city)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name_encrypted text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_encrypted text;

-- Add is_encrypted flag to track migration status
ALTER TABLE public.private_messages ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;
ALTER TABLE public.diary_entries ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;
ALTER TABLE public.travel_documents ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;
ALTER TABLE public.user_annotations ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;
ALTER TABLE public.community_events ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;
ALTER TABLE public.map_pins ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;
ALTER TABLE public.map_pin_comments ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;
ALTER TABLE public.presence_questionnaires ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;