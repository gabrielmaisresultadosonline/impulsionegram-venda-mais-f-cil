import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { OrderRecord } from "./orders-repo.server";

// Exportamos as funções de log que já existem
export { adminListEmailLogs } from "./email-admin.functions";

/**
 * Função centralizada para o reenvio de e-mail de boas-vindas pelo Admin.
 * Esta função é EXPORTADA NOMEADAMENTE e decorada com createServerFn para ser rastreada pelo TanStack Start.
 */
export const adminResendWelcomeEmail = createServerFn({ method: "POST" })
  .validator((data: any) =>
    z.object({
      adminEmail: z.string().email(),
      adminPassword: z.string(),
      customerEmail: z.string().email(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    console.log(`[adminResendWelcomeEmail] Reenvio solicitado para: ${data.customerEmail}`);
    
    try {
      const { isAdminCredentials } = await import("./settings.server");
      const { listSignups } = await import("./signups-repo.server");
      const { sendTransactionalEmail } = await import("./transactional-emails.functions");

      // 1. Validação de segurança no servidor
      if (!isAdminCredentials(data.adminEmail, data.adminPassword)) {
        console.warn(`[adminResendWelcomeEmail] Não autorizado: ${data.adminEmail}`);
        throw new Error("Não autorizado.");
      }

      // 2. Busca o cadastro
      const signups = await listSignups();
      const lead = signups.find((s: any) => s.email.toLowerCase() === data.customerEmail.toLowerCase());


      if (!lead) {
        return { success: false, error: "Cadastro não encontrado no servidor." };
      }

      // 3. Executa o envio transacional
      const result = await sendTransactionalEmail({
        data: {
          type: "welcome",
          name: lead.name,
          email: lead.email,
          orderNsu: `manual-welcome:${Date.now()}`
        }
      });

      console.log(`[adminResendWelcomeEmail] Sucesso:`, result);
      return { success: result.success, error: result.error };
    } catch (err: any) {
      console.error("[adminResendWelcomeEmail] Erro:", err);
      return { success: false, error: `Erro no servidor: ${err.message}` };
    }
  });

/**
 * Padrão de tipos e schemas para o admin.
 */
const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string(),
});

const passwordSchema = credentialsSchema;

const deliverSchema = passwordSchema.extend({
  orderNsu: z.string().trim(),
  action: z.enum(["entregue", "reabrir"]),
});

const adminTicketSchema = passwordSchema.extend({
  orderNsu: z.string().trim(),
  text: z.string().trim(),
});

const pixelSchema = passwordSchema.extend({
  pixelId: z.string().trim(),
});

export interface AdminSettings {
  facebookPixelId: string;
  visits: number;
  signups: number;
  openaiKey?: string;
  aiPrompt?: string;
  aiActive?: boolean;
}

export type AdminOrder = OrderRecord;

async function assertAdmin(email: string, password: string): Promise<void> {
  const { isAdminCredentials } = await import("./settings.server");
  if (!isAdminCredentials(email, password)) {
    throw new Error("Não autorizado.");
  }
}

export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: unknown) => passwordSchema.parse(data))
  .handler(async ({ data }) => {
    const { isAdminCredentials } = await import("./settings.server");
    if (!isAdminCredentials(data.email, data.password)) {
      throw new Error("E-mail ou senha incorretos.");
    }
    return { ok: true };
  });

export const adminListOrders = createServerFn({ method: "POST" })
  .validator((data: unknown) => passwordSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.email, data.password);
    const repo = await import("./orders-repo.server");
    return repo.listOrders();
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) => deliverSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.email, data.password);
    const repo = await import("./orders-repo.server");
    const changed =
      data.action === "entregue"
        ? repo.markDelivered(data.orderNsu)
        : repo.markReopened(data.orderNsu);
    if (!changed) throw new Error("Pedido não encontrado.");
    return repo.listOrders();
  });

export const adminReplyTicket = createServerFn({ method: "POST" })
  .validator((data: unknown) => adminTicketSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.email, data.password);
    const repo = await import("./orders-repo.server");
    const added = repo.addMessage(data.orderNsu, {
      author: "admin",
      text: data.text,
      readByAdmin: true,
    });
    if (!added) throw new Error("Pedido não encontrado.");
    return repo.listOrders();
  });

export interface AdminSignup {
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
  attempts: number;
  lastSeenAt: string;
  source?: string;
  profileUrl?: string;
  region?: string;
  competitor?: string;
  adLink?: string;
  turbinarLink?: string;
}

export const adminListSignups = createServerFn({ method: "POST" })
  .validator((data: unknown) => passwordSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.email, data.password);
    const { listSignups } = await import("./signups-repo.server");
    const repo = await import("./orders-repo.server");

    const map = new Map<string, AdminSignup>();
    for (const signup of await listSignups()) map.set(signup.email.toLowerCase(), signup as any);

    for (const order of repo.listOrders()) {
      const email = (order.customerEmail ?? "").trim().toLowerCase();
      if (!email) continue;
      const existing = map.get(email);
      if (existing) {
        if (order.createdAt < existing.createdAt) existing.createdAt = order.createdAt;
        if (!existing.name) existing.name = order.customerName ?? "";
        if (!existing.phone && order.customerPhone) existing.phone = order.customerPhone;
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
        turbinarLink: order.turbinarLink,
      });
    }

    return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

export const adminGetSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => passwordSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.email, data.password);
    const { getSettings } = await import("./settings.server");
    return getSettings();
  });

export const adminSetPixel = createServerFn({ method: "POST" })
  .validator((data: unknown) => pixelSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.email, data.password);
    const { setFacebookPixelId, getSettings } = await import("./settings.server");
    setFacebookPixelId(data.pixelId);
    return getSettings();
  });

export const adminQuickSendPurchase = createServerFn({ method: "POST" })
  .validator((data: any) => passwordSchema.extend({ orderNsu: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.email, data.password);
    const repo = await import("./orders-repo.server");
    const { sendCapiEvent } = await import("./capi.server");
    const order = repo.getOrderByNsu(data.orderNsu);
    if (!order) throw new Error("Pedido não encontrado.");

    return sendCapiEvent({
      eventName: "Purchase",
      eventId: `quick-${order.orderNsu}`,
      email: order.customerEmail,
      phone: order.customerPhone,
      value: order.priceCents / 100,
      contentName: order.planName,
      orderId: order.orderNsu,
    });
  });

export const adminSendPurchaseEvent = createServerFn({ method: "POST" })
  .validator((data: any) =>
    passwordSchema.extend({
      buyerEmail: z.string().email(),
      buyerPhone: z.string().optional(),
      value: z.number(),
      contentName: z.string().optional(),
      orderId: z.string(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.email, data.password);
    const { sendCapiEvent } = await import("./capi.server");
    return sendCapiEvent({
      eventName: "Purchase",
      eventId: `manual-${data.orderId}`,
      email: data.buyerEmail,
      phone: data.buyerPhone,
      value: data.value,
      contentName: data.contentName,
      orderId: data.orderId,
    });
  });

