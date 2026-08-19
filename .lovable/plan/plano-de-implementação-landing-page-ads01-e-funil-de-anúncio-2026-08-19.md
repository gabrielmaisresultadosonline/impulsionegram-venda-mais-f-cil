# Plano de Implementação: Landing Page /ads01 e Funil de Anúncios

Criação de uma nova vertical de vendas focada em tráfego pago (anúncios no Facebook, Instagram e WhatsApp) com planos específicos e funil dedicado.

## 🏗️ UI Architect

- **Nova Rota `/ads01`**: Landing page com tema dark-neon, novos benefícios (Novos Públicos, Mais Conversões, Filtro Geográfico) e botões de cadastro.
- **Atualização do Quiz**: No funil interno, as perguntas de região agora suportam o conceito de "Mapa com raio mínimo de 40km" e o link do perfil é tratado como "Link da propaganda".
- **Resumo do Pedido**: O benefício exibido no final do quiz destaca a geração de leads e públicos quentes.

## 🗄️ Supabase Engineer (Simulado / Repositório)

- **Novos Planos**: Adição dos planos `ads-10k` (R$ 97), `ads-50k` (R$ 147) e `ads-100k` (R$ 597) ao catálogo `src/lib/plans.ts`.
- **Origem do Pedido**: Registro da origem `ads01` nos pedidos para acompanhamento no admin.

## 🔌 API Integrator

- **Checkout Dinâmico**: Integração dos novos planos com a InfinitePay e cálculo de total considerando order bumps.
- **Diferenciação por Origem**: O painel do cliente (`/painel`) filtra automaticamente os planos exibidos com base no parâmetro `source=ads01`.

## 🔍 Code Auditor

- Garantia de que os novos planos não conflitam com os planos de seguidores existentes.
- Verificação da responsividade dos novos cards de planos na landing page.

## Detalhes Técnicos

- **Planos**:
  - Alcance 10k: R$ 97 (Gestão inclusa)
  - Alcance 50k: R$ 147 (Destaque)
  - Alcance 100k: R$ 597 (VIP)
- **Componentes Modificados**: `src/lib/plans.ts`, `src/routes/painel.tsx`, `src/components/site/wizard/CampaignQuiz.tsx`, `src/routes/ads01.tsx` (novo).
- **Memória**: Atualizada para incluir os detalhes do funil ADS01.
