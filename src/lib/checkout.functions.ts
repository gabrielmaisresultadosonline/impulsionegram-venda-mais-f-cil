import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getPlanById } from "./plans";

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
  .min(2, "Informe o perfil do Instagram")
  .max(200, "Valor muito longo");

const createCheckoutSchema = z.object({
  planId: z.string().trim().min(1).max(64),
  profileUrl: instagramField,
  region: z.string().trim().min(2, "Informe a região").max(120),
  competitor: instagramField,
  posts: z
    .array(z.string().trim().min(4).max(300))
    .min(3, "Envie no mínimo 3 links de publicação")
    .max(5),
  customerName: z.string().trim().min(2, "Informe seu nome").max(120),
  customerEmail: z.string().trim().email("E-mail inválido").max(160),
  customerPhone: z.string().trim().min(10, "Informe o WhatsApp").max(30),
  /** Origem do site, usada para montar redirect_url e webhook_url. */
  origin: z.string().trim().url().max(300),
});

export type CreateCheckoutInput = z.input<typeof createCheckoutSchema>;

export interface CreateCheckoutResult {
  orderNsu: string;
  paymentUrl: string;
}

/** Mantém apenas o origin (protocolo + host) de uma URL confiável em https. */
function safeOrigin(rawOrigin: string): string | null {
  try {
    const url = new URL(rawOrigin);
    if (url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export const createCheckoutLink = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createCheckoutSchema.parse(data))
  .handler(async ({ data }): Promise<CreateCheckoutResult> => {
    const plan = getPlanById(data.planId);
    if (!plan) {
      throw new Error("Plano inválido.");
    }

    const orderNsu = `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const origin = safeOrigin(data.origin);

    const payload: Record<string, unknown> = {
      handle: HANDLE,
      order_nsu: orderNsu,
      items: [
        {
          quantity: 1,
          price: plan.priceCents,
          description: `POPULAR - ${plan.name}`,
        },
      ],
      customer: {
        name: data.customerName,
        email: data.customerEmail,
        ...(data.customerPhone ? { phone_number: data.customerPhone } : {}),
      },
    };

    if (origin) {
      payload.redirect_url = `${origin}/pedido?order_nsu=${encodeURIComponent(orderNsu)}`;
      payload.webhook_url = `${origin}/api/public/infinitepay/webhook`;
    }

    const response = await fetch(`${INFINITEPAY_API}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    if (!response.ok) {
      console.error(`InfinitePay /links falhou [${response.status}]: ${raw}`);
      throw new Error("Não foi possível gerar o link de pagamento. Tente novamente.");
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
      priceCents: plan.priceCents,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone ?? "",
      profileUrl: data.profileUrl,
      region: data.region,
      competitor: data.competitor ?? "",
      posts: data.posts ?? [],
      paymentUrl,
      messages: [],
    });


    return { orderNsu, paymentUrl };

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
  .inputValidator((data: unknown) => paymentCheckSchema.parse(data))
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

