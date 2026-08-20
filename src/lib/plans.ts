/**
 * Catálogo de planos do POPULAR.
 *
 * IMPORTANTE (segurança): este módulo é a ÚNICA fonte de verdade dos preços.
 * O cliente envia apenas o `id` do plano; o servidor resolve o preço aqui.
 * Nunca aceite preço vindo do navegador.
 */

export interface Plan {
  /** Identificador estável usado no payload de checkout. */
  readonly id: string;
  /** Prefixo curto usado no nome do produto na InfinitePay (ex.: "start"). */
  readonly slug: string;
  readonly name: string;
  readonly tagline: string;
  /** Preço em centavos (exigência da API InfinitePay). */
  readonly priceCents: number;
  readonly features: readonly string[];
  readonly highlight?: boolean;
  readonly badge?: string;
  /**
   * Quando true, o plano é exibido apenas de forma informativa: não pode ser
   * selecionado nem enviado ao checkout (alta demanda / esgotado).
   */
  readonly unavailable?: boolean;
}

export const PLANS: readonly Plan[] = [
  {
    id: "starter-500",
    slug: "intro",
    name: "Iniciante 500",
    tagline: "Seguidores filtrados",
    priceCents: 1000,
    features: [
      "500 seguidores filtrados",
      "Seguidores filtrados por região",
      "Filtrados do seu concorrente",
      "Início imediato",
      "Suporte via ticket",
    ],
  },
  {
    id: "basic-1000",
    slug: "start",
    name: "Básico 1.000",
    tagline: "Seguidores filtrados",
    priceCents: 1900,
    features: [
      "1.000 seguidores filtrados",
      "Seguidores filtrados por região",
      "Filtrados do seu concorrente",
      "Início imediato",
      "Suporte via ticket",
    ],
  },
  {
    id: "impulso-2000",
    slug: "boost",
    name: "Impulso 2.000",
    tagline: "Popularidade acelerada",
    priceCents: 3300,
    features: [
      "2.000 seguidores + curtidas",
      "Seguidores filtrados por região",
      "Filtrados do seu concorrente",
      "Entrega natural",
      "Suporte via ticket",
    ],
    highlight: true,
  },
  {
    id: "autoridade-5000",
    slug: "auth",
    name: "Autoridade 5.000",
    tagline: "Domine seu mercado",
    priceCents: 5700,
    features: [
      "5.000 seguidores + curtidas",
      "Seguidores filtrados por região",
      "Filtrados do seu concorrente",
      "Reposicionamento de marca",
      "Suporte via ticket",
    ],
  },
  {
    id: "marketing-completo-up",
    slug: "mktup",
    name: "Marketing Completo",
    tagline: "Combo de crescimento up 30 dias",
    priceCents: 19700,
    features: [
      "+5.000 seguidores reais",
      "Curtidas e comentários diários",
      "+5 MIL visualizações reels",
      "Gestão por 30 dias",
      "Suporte prioritário",
    ],
    highlight: true,
  },
  {
    id: "marketing-completo",
    slug: "full",
    name: "Marketing Completo",
    tagline: "Combo de crescimento 30 dias",
    priceCents: 14700,
    features: [
      "+2.000 seguidores reais",
      "Curtidas e comentários diários",
      "+3 MIL visualizações reels",
      "Gestão por 30 dias",
      "Suporte prioritário",
    ],
    badge: "MAIS VENDIDO",
  },
] as const;


/** Planos padrão da homepage (Seguidores + ADS). */
export const HOME_PLAN_IDS: readonly string[] = [
  "starter-500",
  "basic-1000",
  "impulso-2000",
  "autoridade-5000",
  "marketing-completo",
  "marketing-completo-up",
] as const;

export function getHomePlans(): readonly Plan[] {
  return HOME_PLAN_IDS.map((id) => getPlanById(id)).filter((p): p is Plan => p !== undefined);
}


/** Planos exibidos no funil de salão de beleza (/salaode). */
export const SALON_PLAN_IDS: readonly string[] = [...HOME_PLAN_IDS] as const;

/** Planos exibidos no funil de barbearia (/barbea). */
export const BARBER_PLAN_IDS: readonly string[] = [...HOME_PLAN_IDS] as const;

/** Planos exibidos no funil de terapeutas (/terapi). */
export const THERAPY_PLAN_IDS: readonly string[] = [...HOME_PLAN_IDS] as const;

/** Planos exibidos no funil de delivery (/delivery). */
export const DELIVERY_PLAN_IDS: readonly string[] = [...HOME_PLAN_IDS] as const;

/** Item opcional de "turbine seu plano" (order bump) exibido após escolher o plano. */
export interface OrderBump {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priceCents: number;
}

export const ORDER_BUMPS: readonly OrderBump[] = [
  {
    id: "bump-views-1k",
    name: "+ 1000 visualização",
    description: "Resultados imediatos no seu Reels.",
    priceCents: 700,
  },
  {
    id: "bump-likes-300",
    name: "+ 300 curtidas",
    description: "Dividido em 10 Posts mais recentes.",
    priceCents: 700,
  },
  {
    id: "bump-views-10k",
    name: "+ Turbinar Publicação 10 mil visualização",
    description: "Turbine seu reels vamos mostrar para mais pessoas.",
    priceCents: 1000,
  },
] as const;

export function getOrderBumpById(id: string): OrderBump | undefined {
  return ORDER_BUMPS.find((bump) => bump.id === id);
}

/** Soma segura dos bumps escolhidos (ids desconhecidos são ignorados). */
export function sumOrderBumps(ids: readonly string[]): number {
  return ids.reduce((total, id) => total + (getOrderBumpById(id)?.priceCents ?? 0), 0);
}

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

/** Retorna apenas os planos disponíveis para o nicho de salão de beleza. */
export function getSalonPlans(): readonly Plan[] {
  return SALON_PLAN_IDS.map((id) => getPlanById(id)).filter((p): p is Plan => p !== undefined);
}

/** Retorna apenas os planos disponíveis para o nicho de barbearia. */
export function getBarberPlans(): readonly Plan[] {
  return BARBER_PLAN_IDS.map((id) => getPlanById(id)).filter((p): p is Plan => p !== undefined);
}

/** Retorna apenas os planos disponíveis para o nicho de terapeutas. */
export function getTherapyPlans(): readonly Plan[] {
  return THERAPY_PLAN_IDS.map((id) => getPlanById(id)).filter((p): p is Plan => p !== undefined);
}

/** Retorna apenas os planos disponíveis para o nicho de delivery. */
export function getDeliveryPlans(): readonly Plan[] {
  return DELIVERY_PLAN_IDS.map((id) => getPlanById(id)).filter((p): p is Plan => p !== undefined);
}



/**
 * Monta o nome do produto enviado à InfinitePay: prefixo do plano + e-mail do
 * cliente (ex.: "startcliente@gmail.com"). Isso permite reconhecer o plano e o
 * comprador direto pelo nome do produto no webhook e no extrato.
 */
export function buildProductName(plan: Plan, customerEmail: string): string {
  return `${plan.slug}${customerEmail.trim().toLowerCase()}`;
}

/** Faz o caminho inverso: descobre o plano a partir do nome do produto. */
export function parseProductName(
  productName: string,
): { plan: Plan; customerEmail: string } | undefined {
  const normalized = productName.trim().toLowerCase();
  for (const plan of PLANS) {
    if (normalized.startsWith(plan.slug)) {
      const customerEmail = normalized.slice(plan.slug.length).trim();
      if (customerEmail.includes("@")) return { plan, customerEmail };
    }
  }
  return undefined;
}

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
