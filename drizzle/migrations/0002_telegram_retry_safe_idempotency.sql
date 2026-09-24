ALTER TABLE public.telegram_payment_notifications DROP CONSTRAINT IF EXISTS telegram_payment_notifications_status_check;
ALTER TABLE public.telegram_payment_notifications ADD CONSTRAINT telegram_payment_notifications_status_check CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text]));
DROP INDEX IF EXISTS public.telegram_payment_notifications_unique_event;
CREATE UNIQUE INDEX telegram_payment_notifications_unique_event ON public.telegram_payment_notifications (deposit_id, notification_type, chat_id) WHERE deposit_id IS NOT NULL AND status IN ('pending','sent');
GRANT ALL ON public.telegram_payment_notifications TO service_role;
GRANT ALL ON public.telegram_notification_recipients TO service_role;