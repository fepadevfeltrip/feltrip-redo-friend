ALTER TABLE public.profiles
ADD COLUMN want_news boolean NOT NULL DEFAULT false,
ADD COLUMN want_newsletter boolean NOT NULL DEFAULT false;