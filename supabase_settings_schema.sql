-- Script para criar/atualizar a tabela de configurações no Supabase
-- Este comando garante que os campos de IA e APIs de evolução existam no banco de dados.

CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
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

-- Habilitar RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Garantir acesso ao service_role (usado pelo app via supabaseAdmin)
GRANT ALL ON public.settings TO service_role;
GRANT ALL ON public.settings TO postgres;

-- Política simples para leitura anonima se necessário (opcional, já que usamos admin no server)
CREATE POLICY "Permitir leitura anonima de settings" ON public.settings
FOR SELECT TO anon USING (id = 'global');

-- Inserir linha inicial se não existir
INSERT INTO public.settings (id, facebook_pixel_id)
VALUES ('global', '1055141180794602')
ON CONFLICT (id) DO NOTHING;
