-- Tabela para Logs de E-mail
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_nsu TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- Permissões
GRANT ALL ON public.email_logs TO service_role;
GRANT SELECT ON public.email_logs TO authenticated;

-- RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can do everything on email_logs" ON public.email_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Admins can view all email logs" ON public.email_logs FOR SELECT TO authenticated USING (true);
