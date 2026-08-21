-- Migração para Supabase

-- Tabela de Signups (Leads)
CREATE TABLE public.signups (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    attempts INTEGER DEFAULT 1,
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    source TEXT,
    profile_url TEXT,
    region TEXT,
    competitor TEXT,
    ad_link TEXT,
    profile_saved_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.signups TO authenticated;
GRANT ALL ON public.signups TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.signups TO anon;
ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public signups access" ON public.signups FOR ALL TO anon USING (true) WITH CHECK (true);

-- Tabela de Orders (Pedidos)
CREATE TABLE public.orders (
    order_nsu TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('tentativa', 'pago', 'entregue')),
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    profile_url TEXT,
    region TEXT,
    competitor TEXT,
    ad_link TEXT,
    turbinar_link TEXT,
    posts JSONB DEFAULT '[]'::jsonb,
    bumps JSONB DEFAULT '[]'::jsonb,
    product_name TEXT,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    cancelled_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    payment_url TEXT,
    receipt_url TEXT,
    capture_method TEXT,
    transaction_nsu TEXT,
    messages JSONB DEFAULT '[]'::jsonb
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.orders TO anon;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public orders access" ON public.orders FOR ALL TO anon USING (true) WITH CHECK (true);

-- Tabela de Settings (Configurações)
CREATE TABLE public.settings (
    id TEXT PRIMARY KEY,
    facebook_pixel_id TEXT,
    visits INTEGER DEFAULT 0,
    signups INTEGER DEFAULT 0,
    evolution_api_url TEXT,
    evolution_api_key TEXT,
    evolution_instance TEXT,
    openai_key TEXT,
    ai_prompt TEXT,
    ai_active BOOLEAN DEFAULT false
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
GRANT SELECT ON public.settings TO anon;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public settings read" ON public.settings FOR SELECT TO anon USING (true);
CREATE POLICY "Public settings update" ON public.settings FOR UPDATE TO anon USING (true);

-- Tabela de Emails (Fila de Followup)
CREATE TABLE public.followup_queue (
    id TEXT PRIMARY KEY,
    target_id TEXT NOT NULL,
    step INTEGER NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT ALL ON public.followup_queue TO service_role;
ALTER TABLE public.followup_queue ENABLE ROW LEVEL SECURITY;
