import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { OrderRecord } from "./orders-repo.server";
export { adminListEmailLogs } from "./email-admin.functions";


/**
 * Server functions do painel administrativo.
 *
 * Toda função exige a senha do admin, validada no servidor contra o secret
 * ADMIN_PASSWORD. Nenhuma autorização acontece no cliente.
 */

const credentialsSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(160),
  password: z.string().min(1, "Informe a senha").max(200),
});

const passwordSchema = credentialsSchema;

const deliverSchema = passwordSchema.extend({
  orderNsu: z.string().trim().min(1).max(120),
  action: z.enum(["entregue", "reabrir"]),
});

const adminTicketSchema = passwordSchema.extend({
  orderNsu: z.string().trim().min(1).max(120),
  text: z.string().trim().min(2, "Mensagem muito curta").max(2000),
});

const pixelSchema = passwordSchema.extend({
  pixelId: z
    .string()
    .trim()
    .max(32)
    .regex(/^\d*$/, "O Pixel ID deve conter apenas números"),
});

export interface AdminSettings {
  facebookPixelId: string;
  visits: number;
  signups: number;
  openaiKey?: string;
  aiPrompt?: string;
  aiActive?: boolean;
}

/** Guarda única de autorização usada por todas as funções administrativas. */
async function assertAdmin(email: string, password: string): Promise<void> {
  const { isAdminCredentials } = await import("./settings.server");
  if (!isAdminCredentials(email, password)) {
    throw new Error("Não autorizado.");
  }
}


export type AdminOrder = OrderRecord;

export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: unknown) => passwordSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { isAdminCredentials } = await import("./settings.server");
    if (!isAdminCredentials(data.email, data.password)) {
      throw new Error("E-mail ou senha incorretos.");
    }
    return { ok: true };
  });

export const adminListOrders = createServerFn({ method: "POST" })
  .validator((data: unknown) => passwordSchema.parse(data))
  .handler(async ({ data }): Promise<AdminOrder[]> => {
    await assertAdmin(data.email, data.password);
    const repo = await import("./orders-repo.server");
    return repo.listOrders();
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) => deliverSchema.parse(data))
  .handler(async ({ data }): Promise<AdminOrder[]> => {
    await assertAdmin(data.email, data.password);
    const repo = await import("./orders-repo.server");
    const changed =
      data.action === "entregue"
        ? repo.markDelivered(data.orderNsu)
        : repo.markReopened(data.orderNsu);
    if (!changed) {
      throw new Error("Pedido não encontrado.");
    }
    return repo.listOrders();
  });

export const adminReplyTicket = createServerFn({ method: "POST" })
  .validator((data: unknown) => adminTicketSchema.parse(data))
  .handler(async ({ data }): Promise<AdminOrder[]> => {
    await assertAdmin(data.email, data.password);
    const repo = await import("./orders-repo.server");
    const added = repo.addMessage(data.orderNsu, {
      author: "admin",
      text: data.text,
      readByAdmin: true,
    });
    if (!added) {
      throw new Error("Pedido não encontrado.");
    }
    return repo.listOrders();
  });


export interface AdminSignup {
  email: string;
  name: string;
  /** WhatsApp informado no cadastro (ou recuperado do pedido). */
  phone?: string;
  createdAt: string;
  attempts: number;
  lastSeenAt: string;
  /** Origem do cadastro (home, salaode, barbea, terapi). */
  source?: string;
  /** Dados da campanha salvos antes do pagamento. */
  profileUrl?: string;
  region?: string;
  competitor?: string;
  adLink?: string;
  profileSavedAt?: string;
}

/**
 * Lista os cadastros feitos na home (nome, e-mail e horário).
 *
 * Além do arquivo de cadastros, reconstruímos leads a partir dos pedidos
 * já registrados — assim nenhum cliente antigo some do painel mesmo que o
 * registro de cadastro tenha sido criado depois dele.
 */
export const adminListSignups = createServerFn({ method: "POST" })
  .validator((data: unknown) => passwordSchema.parse(data))
  .handler(async ({ data }): Promise<AdminSignup[]> => {
    await assertAdmin(data.email, data.password);
    const { listSignups } = await import("./signups-repo.server");
    const repo = await import("./orders-repo.server");

    const map = new Map<string, AdminSignup>();
    for (const signup of listSignups()) map.set(signup.email.toLowerCase(), signup);

    for (const order of repo.listOrders()) {
      const email = (order.customerEmail ?? "").trim().toLowerCase();
      if (!email) continue;
      const existing = map.get(email);
      if (existing) {
        // Mantém a data mais antiga como criação do lead.
        if (order.createdAt < existing.createdAt) existing.createdAt = order.createdAt;
        if (!existing.name) existing.name = order.customerName ?? "";
        if (!existing.phone && order.customerPhone) existing.phone = order.customerPhone;
        if (!existing.source && order.source) existing.source = order.source;
        if (!existing.profileUrl && order.profileUrl) existing.profileUrl = order.profileUrl;
        if (!existing.region && order.region) existing.region = order.region;
        if (!existing.adLink && order.adLink) existing.adLink = order.adLink;
        continue;
      }
      map.set(email, {
        email,
        name: order.customerName ?? "",
        phone: order.customerPhone ?? undefined,
        createdAt: order.createdAt,
        attempts: 1,
        lastSeenAt: order.createdAt,
        source: order.source ?? "home",
        profileUrl: order.profileUrl,
        region: order.region,
        adLink: order.adLink,
      });
    }

    return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });


export const adminGetSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => passwordSchema.parse(data))
  .handler(async ({ data }): Promise<AdminSettings> => {
    await assertAdmin(data.email, data.password);
    const { getSettings } = await import("./settings.server");
    return getSettings();
  });

export const adminSetPixel = createServerFn({ method: "POST" })
  .validator((data: unknown) => pixelSchema.parse(data))
  .handler(async ({ data }): Promise<AdminSettings> => {
    await assertAdmin(data.email, data.password);
    const { setFacebookPixelId, getSettings } = await import("./settings.server");
    setFacebookPixelId(data.pixelId);
    return getSettings();
  });

const manualPurchaseSchema = passwordSchema.extend({
  /** E-mail do comprador — melhora a correspondência do evento no Meta. */
  buyerEmail: z.string().trim().email("E-mail do comprador inválido").max(160),
  buyerPhone: z.string().trim().max(40).optional(),
  value: z.coerce.number().nonnegative().max(1_000_000),
  contentName: z.string().trim().max(160).optional(),
  /** Identificador do pedido; também é usado como event_id (deduplicação). */
  orderId: z.string().trim().min(1).max(120),
});

/**
 * Reenvia manualmente um evento Purchase pela API de Conversões do Meta.
 *
 * Uso: quando uma venda real não foi contabilizada no Facebook (bloqueador,
 * aba fechada antes do disparo). O `event_id` é derivado do orderId, então
 * reenviar o mesmo pedido não duplica a conversão no Meta.
 */
export const adminSendPurchaseEvent = createServerFn({ method: "POST" })
  .validator((data: unknown) => manualPurchaseSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    await assertAdmin(data.email, data.password);
    const { sendCapiEvent } = await import("./capi.server");

    // Tentamos obter o token dinâmico das configurações (PixelId)
    // embora o sendCapiEvent use process.env para o token de acesso.
    const result = await sendCapiEvent({
      eventName: "Purchase",
      eventId: `manual-${data.orderId}`,
      email: data.buyerEmail,
      phone: data.buyerPhone,
      value: data.value,
      contentName: data.contentName,
      orderId: data.orderId,
    });

    if (!result.ok) {
      console.error(
        `[Admin] Meta recusou evento manual para ${data.buyerEmail}. Verifique FACEBOOK_CAPI_TOKEN no servidor.`,
      );
    }

    return result;
  });

const quickPurchaseSchema = passwordSchema.extend({
  orderNsu: z.string().trim().min(1),
});

/**
 * Atalho para enviar o evento de compra direto de um pedido existente no admin.
 */
export const adminQuickSendPurchase = createServerFn({ method: "POST" })
  .validator((data: unknown) => quickPurchaseSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    await assertAdmin(data.email, data.password);
    const repo = await import("./orders-repo.server");
    const { sendCapiEvent } = await import("./capi.server");

    const orders = repo.listOrders();
    const order = orders.find((o) => o.orderNsu === data.orderNsu);
    if (!order) throw new Error("Pedido não encontrado.");

    return sendCapiEvent({
      eventName: "Purchase",
      eventId: `quick-${order.orderNsu}`,
      email: order.customerEmail,
      phone: order.customerPhone || undefined,
      value: order.priceCents / 100,
      contentName: order.planName,
      orderId: order.orderNsu,
    });
  });

