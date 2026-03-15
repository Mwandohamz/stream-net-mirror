
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('user', 'admin')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ticket messages"
ON public.ticket_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_messages.ticket_id AND st.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own ticket messages"
ON public.ticket_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_role = 'user' AND
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_messages.ticket_id AND st.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can read all ticket messages"
ON public.ticket_messages FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ticket messages"
ON public.ticket_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_role = 'admin' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE OR REPLACE FUNCTION public.update_ticket_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.support_tickets SET updated_at = now() WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ticket_message_update_ticket
AFTER INSERT ON public.ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.update_ticket_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
