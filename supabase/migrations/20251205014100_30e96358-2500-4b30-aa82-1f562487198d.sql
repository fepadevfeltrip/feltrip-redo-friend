-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to send notification email via edge function
CREATE OR REPLACE FUNCTION public.send_notification_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Call edge function to send email
  PERFORM net.http_post(
    url := 'https://udpesustqkrbeijgymqh.supabase.co/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcGVzdXN0cWtyYmVpamd5bXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTM0NzIsImV4cCI6MjA3OTM4OTQ3Mn0.uIXYP03asZF3h8T8OuJkeFEKwaQZWCMAb1Ih1UqMan8'
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'type', NEW.type,
      'title', NEW.title,
      'message', NEW.message
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger to send email on notification insert
DROP TRIGGER IF EXISTS trigger_send_notification_email ON public.notifications;
CREATE TRIGGER trigger_send_notification_email
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.send_notification_email();