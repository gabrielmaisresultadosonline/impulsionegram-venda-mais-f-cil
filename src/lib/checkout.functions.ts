import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildProductName, getOrderBumpById, getPlanById } from "./plans";
import { normalizePhone, safeOrigin } from "./checkout.server";
import { normalizeSource } from "./traffic-source";

/**
 * Integração InfinitePay (Checkout Integrado).
 *
 * Fluxo:
 *  1. `createCheckoutLink` monta o payload no servidor (preço vem do catálogo,
 *     nunca do cliente) e chama POST /links.
 *  2. O cliente é redirecionado para o link retornado.
 *  3. Após pagar, o usuário volta para /pedido com os parâmetros de retorno.
 *  4. `checkPaymentStatus` consulta POST /payment_check em tempo real.
 *  5. O webhook público (/api/public/infinitepay/webhook) recebe a confirmação
 *     assíncrona da InfinitePay.
 */

const INFINITEPAY_API = "https://api.checkout.infinitepay.io";

/** InfiniteTag do vendedor (sem o "$"). */
const HANDLE = "paguemro";

const instagramField = z
  .string()
  .trim()
  .max(200, "Valor muito longo")
  .optional()
  .nullable()
  .or(z.literal(""));

const createCheckoutSchema = z.object({
  planId: z.string().trim().min(1).max(64),
  profileUrl: instagramField,
  region: z.string().trim().min(2, "Informe a região").max(120),
  competitor: instagramField,
  customerName: z.string().trim().min(2, "Informe seu nome").max(120),
  customerEmail: z.string().trim().email("E-mail inválido").max(160),
  customerPhone: z.string().trim().min(10, "Informe o WhatsApp").max(30),
  /** Origem do site, usada para montar redirect_url e webhook_url. */
  origin: z.string().trim().url().max(300),
  /** Landing page de origem do funil, usada nos relatórios do admin. */
  source: z.string().trim().max(40).optional(),
  /** Order bumps opcionais escolhidos no popup "turbine seu plano". */
  bumpIds: z.array(z.string().trim().max(64)).max(10).optional(),
  adLink: z.string().trim().max(500).optional().nullable().or(z.literal("")),
  turbinarLink: z.string().trim().max(500).optional().nullable().or(z.literal("")),
});

export type CreateCheckoutInput = z.input<typeof createCheckoutSchema>;

export interface CreateCheckoutResult {
  orderNsu: string;
  paymentUrl: string;
  /** Nome do produto (planoslug + e-mail) usado para conciliação. */
  productName: string;
}

export const createCheckoutLink = createServerFn({ method: "POST" })
  .validator((data: unknown) => createCheckoutSchema.parse(data))
  .handler(async ({ data }): Promise<CreateCheckoutResult> => {
    const plan = getPlanById(data.planId);
    if (!plan) {
      throw new Error("Plano inválido.");
    }
    // Defesa no servidor: planos bloqueados nunca geram link de pagamento.
    if (plan.unavailable) {
      throw new Error("Plano indisponível no momento, devido à alta demanda.");
    }

    const orderNsu = `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const origin = safeOrigin(data.origin);
    // Nome do produto = prefixo do plano + e-mail. Serve de chave alternativa
    // para reconhecer a venda no webhook mesmo sem o NSU.
    const productName = buildProductName(plan, data.customerEmail);

    // Preço dos bumps também vem do catálogo do servidor, nunca do cliente.
    const bumps = (data.bumpIds ?? [])
      .map((id) => getOrderBumpById(id))
      .filter((bump): bump is NonNullable<typeof bump> => bump !== undefined);
    const bumpsCents = bumps.reduce((total, bump) => total + (bump.priceCents || 0), 0);
    const totalCents = plan.priceCents + bumpsCents;

    const phone = normalizePhone(data.customerPhone ?? "");

    const buildPayload = (withPhone: boolean): Record<string, unknown> => {
      const items = [
        {
          quantity: 1,
          price: plan.priceCents || 0,
          description: productName || "Plano",
        },
        ...bumps.map((bump) => ({
          quantity: 1,
          price: bump.priceCents || 0,
          description: bump.name || "Order Bump",
        })),
      ];

      // O link da publicação a turbinar NÃO vai para a InfinitePay: ele fica
      // salvo apenas no banco (visível no /admin) para processar o pedido.


      const safeItems = items.filter((item) => Number(item.price) > 0);

      const payload: Record<string, unknown> = {
        handle: HANDLE,
        order_nsu: orderNsu,
        items: safeItems,
        customer: {
          name: data.customerName,
          email: data.customerEmail,
          ...(withPhone && phone ? { phone_number: phone } : {}),
        },
      };

      if (origin) {
        payload.redirect_url = `${origin}/pedido?order_nsu=${encodeURIComponent(orderNsu)}`;
        payload.webhook_url = `${origin}/api/public/infinitepay/webhook`;
      }

      return payload;
    };

    const requestLink = async (withPhone: boolean) => {
      const response = await fetch(`${INFINITEPAY_API}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(withPhone)),
      });
      return { response, raw: await response.text() };
    };

    let { response, raw } = await requestLink(Boolean(phone));

    // A InfinitePay recusa telefones fora do padrão com 422. Nesse caso
    // repetimos sem o telefone: o pagamento é mais importante que o campo.
    if (!response.ok && phone) {
      console.error(`InfinitePay /links falhou [${response.status}]: ${raw}. Retentando sem telefone.`);
      ({ response, raw } = await requestLink(false));
    }

    if (!response.ok) {
      console.error(`InfinitePay /links falhou [${response.status}]: ${raw}`);
      // Instrumentação de diagnóstico temporária
      throw new Error(`Não foi possível gerar o link de pagamento. Status: ${response.status}. Detalhes: ${raw.slice(0, 500)}`);
    }


    let parsed: { url?: string; link?: string; payment_url?: string } = {};
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      console.error("InfinitePay /links retornou resposta não-JSON.");
      throw new Error("Resposta inesperada do provedor de pagamento.");
    }

    const paymentUrl = parsed.url ?? parsed.link ?? parsed.payment_url;
    if (!paymentUrl) {
      console.error("InfinitePay /links sem URL de pagamento no corpo.");
      throw new Error("Resposta inesperada do provedor de pagamento.");
    }

    // Registra a tentativa de compra para o painel administrativo.
    const { recordAttempt } = await import("./orders-repo.server");
    recordAttempt({
      orderNsu,
      planId: plan.id,
      planName: plan.name,
      priceCents: totalCents,
      bumps: bumps.map((bump) => ({
        id: bump.id,
        name: bump.name,
        priceCents: bump.priceCents,
      })),
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone ?? "",
      profileUrl: data.profileUrl ?? "",
      region: data.region,
      competitor: data.competitor ?? "",
      adLink: data.adLink ?? "",
      turbinarLink: data.turbinarLink ?? "",
      posts: [],
      productName,
      source: normalizeSource(data.source),
      paymentUrl,
    });



    return { orderNsu, paymentUrl, productName };

  });

const paymentCheckSchema = z.object({
  orderNsu: z.string().trim().min(1).max(120),
  transactionNsu: z.string().trim().max(120).optional().default(""),
  slug: z.string().trim().max(120).optional().default(""),
});

export interface PaymentStatus {
  paid: boolean;
  amount?: number;
  paidAmount?: number;
  captureMethod?: string;
  installments?: number;
}

export const checkPaymentStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => paymentCheckSchema.parse(data))
  .handler(async ({ data }): Promise<PaymentStatus> => {
    const response = await fetch(`${INFINITEPAY_API}/payment_check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: HANDLE,
        order_nsu: data.orderNsu,
        transaction_nsu: data.transactionNsu,
        slug: data.slug,
      }),
    });

    if (!response.ok) {
      // Enquanto o pagamento não existe, a API pode responder com erro.
      return { paid: false };
    }

    const body = (await response.json()) as {
      success?: boolean;
      paid?: boolean;
      amount?: number;
      paid_amount?: number;
      installments?: number;
      capture_method?: string;
    };

    const paid = Boolean(body.paid);

    if (paid) {
      // Fonte de verdade confirmada pela InfinitePay: propaga para o admin.
      const { markPaid } = await import("./orders-repo.server");
      markPaid(data.orderNsu, {
        captureMethod: body.capture_method,
        transactionNsu: data.transactionNsu || undefined,
      });
    }

    return {
      paid,
      amount: body.amount,
      paidAmount: body.paid_amount,
      installments: body.installments,
      captureMethod: body.capture_method,
    };
  });


const emailSchema = z.object({
  customerEmail: z.string().trim().email().max(160),
});

export interface OrderStatusByEmail {
  found: boolean;
  paid: boolean;
  orderNsu?: string;
  planName?: string;
  priceCents?: number;
}

/**
 * Fallback de conciliação: quando o cliente perde o NSU (fechou a aba, voltou
 * depois), consultamos pelo e-mail o pedido mais recente já confirmado pelo
 * webhook. Não expõe dados de outros clientes além do próprio pedido.
 */
export const getOrderStatusByEmail = createServerFn({ method: "POST" })
  .validator((data: unknown) => emailSchema.parse(data))
  .handler(async ({ data }): Promise<OrderStatusByEmail> => {
    const { getLatestOrderByEmail } = await import("./orders-repo.server");
    const order = await getLatestOrderByEmail(data.customerEmail);
    if (!order) return { found: false, paid: false };

    return {
      found: true,
      paid: order.status !== "tentativa",
      orderNsu: order.orderNsu,
      planName: order.planName,
      priceCents: order.priceCents,
    };
  });
