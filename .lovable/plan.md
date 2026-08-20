# Plan: Persistência de Dados via Lovable Cloud

O usuário expressou preocupação com a perda de dados (usuários cadastrados, tokens, prompts) ao atualizar o servidor. Atualmente, o projeto utiliza arquivos JSON locais (`.data/*.json`) e variáveis em memória para persistência. Embora os arquivos `.data/` persistam entre reinícios do processo Node, eles podem ser perdidos em deploys que recriam o sistema de arquivos ou em ambientes "stateless".

Este plano propõe a ativação do **Lovable Cloud** (Supabase) para garantir que todos os dados sejam armazenados em um banco de dados relacional (PostgreSQL) com backup e persistência real, eliminando o risco de perda de dados.

## Alterações Propostas

### Backend & Banco de Dados (Supabase)
- Ativar o Lovable Cloud.
- Criar tabelas para:
    - `signups`: Dados dos leads e cadastros.
    - `orders`: Pedidos, pagamentos e tickets de suporte.
    - `site_settings`: Configurações globais (Pixel ID, Chave OpenAI, Prompt da IA).
    - `email_followup_queue`: Fila de e-mails transacionais.
    - `user_roles`: Controle de acesso administrativo.
- Implementar RLS (Row Level Security) em todas as tabelas.

### Refatoração de Código
- Migrar `src/lib/orders-repo.server.ts` de arquivos locais para queries no Supabase.
- Migrar `src/lib/settings.server.ts` de arquivos locais para queries no Supabase.
- Atualizar funções de e-mail e follow-up para buscar dados no banco.
- Garantir que as credenciais administrativas sejam validadas via banco ou políticas de RLS.

## Detalhes Técnicos

1. **Esquema de Banco de Dados:**
    - `public.signups`: (email, name, phone, profile_url, region, competitor, ad_link, source, created_at, last_seen_at, attempts)
    - `public.orders`: (order_nsu, status, plan_id, plan_name, price_cents, customer_email, customer_name, profile_url, region, competitor, created_at, paid_at, delivered_at, messages JSONB)
    - `public.site_settings`: (id, key, value) ou colunas específicas para configurações únicas.

2. **Segurança:**
    - Uso de `service_role` apenas em funções de servidor (`.server.ts`).
    - Políticas de RLS para permitir que usuários vejam apenas seus próprios pedidos (quando autenticados via Supabase Auth futuramente).

3. **Migração:**
    - Criar uma rotina de migração única para importar os dados existentes dos arquivos `.data/*.json` para o Supabase (executada uma única vez).

## Próximos Passos
1. Ativar Lovable Cloud através da ferramenta `supabase--enable`.
2. Criar as migrações SQL necessárias.
3. Substituir as implementações de persistência atuais.
