-- Tabela de administradores para validação de funções protegidas
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Permissões (Apenas service_role acessa admin_users para verificação de senha)
GRANT ALL ON public.admin_users TO service_role;
GRANT SELECT ON public.admin_users TO authenticated;

-- Inserir admin padrão (Se não existir)
INSERT INTO public.admin_users (email, password)
VALUES ('mro@gmail.com', 'Ga145523@')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

-- Tabela de Configurações Globais (Pixel, Visitas, OpenAI)
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    facebook_pixel_id TEXT,
    visits BIGINT DEFAULT 0,
    signups BIGINT DEFAULT 0,
    evolution_api_url TEXT,
    evolution_api_key TEXT,
    evolution_instance TEXT,
    openai_key TEXT,
    ai_prompt TEXT,
    ai_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.settings TO service_role;
GRANT SELECT ON public.settings TO anon;
GRANT SELECT ON public.settings TO authenticated;

-- Inserir configurações padrão
INSERT INTO public.settings (id, facebook_pixel_id)
VALUES ('global', '1055141180794602')
ON CONFLICT (id) DO NOTHING;

-- Tabela de Cadastros (Signups)
CREATE TABLE IF NOT EXISTS public.signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    source TEXT DEFAULT 'home',
    profile_url TEXT,
    region TEXT,
    competitor TEXT,
    ad_link TEXT,
    turbinar_link TEXT,
    attempts INTEGER DEFAULT 1,
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.signups TO service_role;
GRANT SELECT ON public.signups TO anon;
GRANT SELECT, INSERT, UPDATE ON public.signups TO authenticated;

-- Tabela de Pedidos (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_nsu TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'tentativa', -- 'tentativa', 'pago', 'entregue'
    profile_url TEXT,
    region TEXT,
    competitor TEXT,
    ad_link TEXT,
    turbinar_link TEXT,
    source TEXT DEFAULT 'home',
    payment_method TEXT,
    paid_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.orders TO service_role;
GRANT SELECT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;

-- Tabela de Logs de E-mail
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_nsu TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.email_logs TO service_role;
GRANT SELECT ON public.email_logs TO authenticated;
