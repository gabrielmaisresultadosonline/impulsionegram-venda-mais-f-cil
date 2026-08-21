-- MIGRATION: Persistência de E-mails e Fila no Supabase

-- Tabela de Logs de E-mail (se não existir)
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_nsu TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT ALL ON public.email_logs TO service_role;
GRANT SELECT ON public.email_logs TO authenticated;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read logs" ON public.email_logs FOR SELECT TO authenticated USING (true);

-- Tabela de Fila de Follow-up no Supabase (Substitui JSON local)
CREATE TABLE IF NOT EXISTS public.followup_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_nsu TEXT UNIQUE NOT NULL,
    next_followup_index INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT ALL ON public.followup_queue TO service_role;
GRANT SELECT ON public.followup_queue TO authenticated;
ALTER TABLE public.followup_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage queue" ON public.followup_queue FOR ALL TO authenticated USING (true);

-- HINT: Execute no painel SQL do Supabase para ativar a persistência em nuvem completa.
