/**
 * Catálogo de planos do Impulsionegram.
 *
 * IMPORTANTE (segurança): este módulo é a ÚNICA fonte de verdade dos preços.
 * O cliente envia apenas o `id` do plano; o servidor resolve o preço aqui.
 * Nunca aceite preço vindo do navegador.
 */

export interface Plan {
  /** Identificador estável usado no payload de checkout. */
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  /** Preço em centavos (exigência da API InfinitePay). */
  readonly priceCents: number;
  readonly features: readonly string[];
  readonly highlight?: boolean;
  readonly badge?: string;
}

export const PLANS: readonly Plan[] = [
  {
    id: "seg-1000",
    name: "Start 1.000",
    tagline: "Primeiro empurrão no perfil",
    priceCents: 1400,
    features: [
      "1.000 seguidores brasileiros",
      "Filtrados por região",
      "Entrega em até 6 horas",
      "Suporte por ticket no painel",
    ],

  },
  {
    id: "seg-2000",
    name: "Impulso 2.000",
    tagline: "Seguidores + engajamento",
    priceCents: 2900,
    features: [
      "2.000 seguidores filtrados por região",
      "Curtidas nas publicações",
      "Filtro por concorrente",
      "Entrega em até 6 horas",
    ],
  },
  {
    id: "seg-5000",
    name: "Autoridade 5.000",
    tagline: "Prova social de verdade",
    priceCents: 5700,
    features: [
      "5.000 seguidores filtrados por região",
      "Curtidas nas publicações",
      "Filtro por concorrente",
      "Entrega em até 6 horas",
    ],
    badge: "Mais vendido",
    highlight: true,
  },
  {
    id: "marketing-completo",
    name: "Marketing Completo",
    tagline: "30 dias de crescimento contínuo",
    priceCents: 14700,
    features: [
      "+ de 10 mil visualizações",
      "+2.000 seguidores filtrados por região",
      "Curtidas recorrentes",
      "Comentários reais por 30 dias",
      "Acompanhamento durante todo o período",
    ],
    badge: "Completo",
  },
] as const;

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

