import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildProductName, getOrderBumpById, getPlanById } from "./plans";
import { normalizePhone, safeOrigin } from "./checkout.server";
import { normalizeSource } from "./traffic-source";

/**
 * Integração InfinitePay (Checkout Integrado).
 */

const INFINITEPAY_API = "https://api.checkout.infinitepay.io";
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
  origin: z.string().trim().url().max(300),
  source: z.string().trim().max(40).optional(),
  bumpIds: z.array(z.string().trim().max(64)).max(10).optional(),
  adLink: z.string().trim().max(500).optional().nullable().or(z.literal("")),
  turbinarLink: z.string().trim().max(500).optional().nullable().or(z.literal("")),
});

export type CreateCheckoutInput = z.input<typeof createCheckoutSchema>;

export interface CreateCheckoutResult {
  orderNsu: string;
  paymentUrl: string;
  productName: string;
}

export const createCheckoutLink = createServerFn({ method: "POST" })
  .validator((data: unknown) => createCheckoutSchema.parse(data))
  .handler(async ({ data }): Promise<CreateCheckoutResult> => {
    const plan = getPlanById(data.planId);
    if (!plan) throw new Error("Plano inválido.");
    if (plan.unavailable) throw new Error("Plano indisponível no momento.");

    const orderNsu = `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const origin = safeOrigin(data.origin);
    const productName = buildProductName(plan, data.customerEmail);

    const bumps = (data.bumpIds ?? [])
      .map((id) => getOrderBumpById(id))
      .filter((bump): bump is NonNullable<typeof bump> => bump !== undefined);
    const totalCents = plan.priceCents + bumps.reduce((total, bump) => total + bump.priceCents, 0);

    const phone = normalizePhone(data.customerPhone ?? "");

    const buildPayload = (withPhone: boolean) => ({
      handle: HANDLE,
      order_nsu: orderNsu,
      items: [
        { quantity: 1, price: plan.priceCents, description: productName },
        ...bumps.map((bump) => ({ quantity: 1, price: bump.priceCents, description: bump.name })),
        ...(data.turbinarLink ? [{ quantity: 1, price: 0, description: `Link Turbinar: ${data.turbinarLink}` }] : [])
      ],
      customer: {
        name: data.customerName,
        email: data.customerEmail,
        ...(withPhone && phone ? { phone_number: phone } : {}),
      },
      ...(origin ? {
        redirect_url: `${origin}/pedido?order_nsu=${encodeURIComponent(orderNsu)}`,
        webhook_url: `${origin}/api/public/infinitepay/webhook`
      } : {})
    });

    const requestLink = async (withPhone: boolean) => {
      const response = await fetch(`${INFINITEPAY_API}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(withPhone)),
      });
      return { response, raw: await response.text() };
    };

    let { response, raw } = await requestLink(Boolean(phone));
    if (!response.ok && phone) ({ response, raw } = await requestLink(false));

    if (!response.ok) throw new Error("Não foi possível gerar o link de pagamento.");

    const parsed = JSON.parse(raw);
    const paymentUrl = parsed.url ?? parsed.link ?? parsed.payment_url;
    if (!paymentUrl) throw new Error("Resposta inesperada do provedor de pagamento.");

    const { recordAttempt } = await import("./orders-repo.server");
    await recordAttempt({
      orderNsu,
      planId: plan.id,
      planName: plan.name,
      priceCents: totalCents,
      bumps: bumps.map((bump) => ({ id: bump.id, name: bump.name, priceCents: bump.priceCents })),
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

export const checkPaymentStatus = createServerFn({ method: "POST" })
  .validator((data: any) => z.object({
    orderNsu: z.string().trim().min(1).max(120),
    transactionNsu: z.string().trim().max(120).optional().default(""),
    slug: z.string().trim().max(120).optional().default(""),
  }).parse(data))
  .handler(async ({ data }) => {
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

    if (!response.ok) return { paid: false };

    const body = await response.json();
    const paid = Boolean(body.paid);

    if (paid) {
      const { markPaid } = await import("./orders-repo.server");
      await markPaid(data.orderNsu, {
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

export const getOrderStatusByEmail = createServerFn({ method: "POST" })
  .validator((data: any) => z.object({ customerEmail: z.string().trim().email().max(160) }).parse(data))
  .handler(async ({ data }) => {
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
