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
    id: "seg-1000",
    slug: "basico",
    name: "Básico 1.000",
    tagline: "Seguidores reais",
    priceCents: 1400,
    features: ["1.000 seguidores reais", "Entrega em até 6 horas"],
  },

  {
    id: "seg-2000",
    slug: "impulso",
    name: "Impulso 2.000",
    tagline: "Seguidores filtrados + curtidas",
    priceCents: 2900,
    features: [
      "2.000 seguidores filtrados por região",
      "Curtidas nas publicações",
      "Entrega em até 6 horas",
    ],
  },
  {
    id: "seg-5000",
    slug: "autoridade",
    name: "Autoridade 5.000",
    tagline: "Máxima visibilidade e alcance",
    priceCents: 5700,
    features: [
      "5.000 seguidores",
      "5 mil alcance em 60% dos posts/reels",
      "5.000 visualizações",
      "Entrega em até 6 horas",
    ],
    badge: "Mais vendido",
    highlight: true,
  },
  {
    id: "marketing-completo",
    slug: "marketing",
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
  {
    id: "trimestral-10k",
    slug: "trimestral",
    name: "Trimestral 10K",
    tagline: "3 meses de visibilidade garantida",
    priceCents: 29700,
    features: [
      "10 mil seguidores filtrados por região",
      "10 mil visualizações",
      "Curtidas e engajamento contínuos",
      "Válido por 3 meses",
      "Até 12x de R$30 no cartão",
    ],
    badge: "Mais economia",
  },
  {
    id: "ads-10k",
    slug: "ads10",
    name: "Alcance 10.000",
    tagline: "Alcance mensal de contas reais",
    priceCents: 9700,
    features: [
      "Alcance de 10.000 contas mensal",
      "Engajamento, curtidas, comentários",
      "Leads no WhatsApp e conversões",
      "Gestão de anúncios inclusa",
      "Valor pago à Meta incluso",
    ],
  },
  {
    id: "ads-50k",
    slug: "ads50",
    name: "Alcance 50.000",
    tagline: "Alcance mensal de contas reais",
    priceCents: 14700,
    features: [
      "Alcance de 50.000 contas mensal",
      "Engajamento, curtidas, comentários",
      "Leads no WhatsApp e conversões",
      "Gestão de anúncios inclusa",
      "Valor pago à Meta incluso",
    ],
    highlight: true,
  },
  {
    id: "ads-100k",
    slug: "ads100",
    name: "Alcance 100.000",
    tagline: "Alcance mensal massivo",
    priceCents: 59700,
    features: [
      "Alcance de 100.000 contas mensal",
      "Engajamento, curtidas, comentários",
      "Leads no WhatsApp e conversões",
      "Gestão de anúncios inclusa",
      "Valor pago à Meta incluso",
    ],
    badge: "VIP",
  },
] as const;

/** Planos exibidos no funil de anúncios (/ads01). */
export const ADS_PLAN_IDS: readonly string[] = ["ads-10k", "ads-50k", "ads-100k"] as const;

/** Retorna apenas os planos disponíveis para o funil de anúncios. */
export function getAdsPlans(): readonly Plan[] {
  return ADS_PLAN_IDS.map((id) => getPlanById(id)).filter((p): p is Plan => p !== undefined);
}


/** Planos exibidos no funil de salão de beleza (/salaode). */
export const SALON_PLAN_IDS: readonly string[] = [
  "marketing-completo",
  "trimestral-10k",
] as const;

/** Planos exibidos no funil de barbearia (/barbea). */
export const BARBER_PLAN_IDS: readonly string[] = [
  "marketing-completo",
  "trimestral-10k",
] as const;

/** Planos exibidos no funil de terapeutas (/terapi). */
export const THERAPY_PLAN_IDS: readonly string[] = [
  "marketing-completo",
  "trimestral-10k",
] as const;

/** Planos exibidos no funil de delivery (/delivery). */
export const DELIVERY_PLAN_IDS: readonly string[] = [
  "marketing-completo",
  "trimestral-10k",
] as const;

/** Item opcional de "turbine seu plano" (order bump) exibido após escolher o plano. */
export interface OrderBump {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priceCents: number;
}

export const ORDER_BUMPS: readonly OrderBump[] = [
  {
    id: "bump-google-3k",
    name: "Anunciar no Google (3 mil pessoas)",
    description: "Expandimos sua campanha para o Google por 30 dias.",
    priceCents: 4700,
  },
  {
    id: "bump-google-5k",
    name: "Anunciar no Google (5 mil pessoas)",
    description: "Alcance máximo no Google com 5 mil pessoas impactadas.",
    priceCents: 7700,
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
