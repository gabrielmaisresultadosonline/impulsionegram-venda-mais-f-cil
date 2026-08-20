import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

/**
 * Funções públicas do Pixel do Facebook.
 *
 * O Pixel ID é público por natureza (executa no navegador do visitante), por
 * isso pode ser lido sem autenticação. A configuração/escrita só acontece pelo
 * painel administrativo autenticado (admin.functions.ts).
 */

export const getPixelConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ pixelId: string }> => {
    const { getSettings } = await import("./settings.server");
    return { pixelId: getSettings().facebookPixelId };
  },
);

const eventSchema = z.object({
  type: z.enum(["pageview", "signup"]),
  /** Enviados apenas no cadastro, para listar os leads no painel admin. */
  name: z.string().trim().max(160).optional(),
  email: z.string().trim().max(160).optional(),
  /** WhatsApp obrigatório no cadastro da home. */
  phone: z.string().trim().max(40).optional(),
  /** Landing page de origem (home, salaode, barbea, terapi, whats). */
  source: z.string().trim().max(40).optional(),
  password: z.string().optional(),
});

/** Contadores internos de visita/cadastro exibidos no painel administrativo. */
export const trackSiteEvent = createServerFn({ method: "POST" })
  .validator((data: unknown) => eventSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const settings = await import("./settings.server");
    if (data.type === "pageview") {
      settings.incrementVisits();
      return { ok: true };
    }

    settings.incrementSignups();
    if (data.email) {
      const { recordSignup } = await import("./signups-repo.server");
      // O e-mail de boas-vindas agora é disparado dentro do recordSignup (servidor)
      await recordSignup({
        name: data.name ?? "",
        email: data.email,
        phone: data.phone,
        source: data.source,
        password: (data as any).password,
      });

      // Dispara CAPI Lead no servidor para maior precisão
      const { sendCapiEvent } = await import("./capi.server");
      const eventId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const forwardedFor = getRequestHeader("x-forwarded-for") ?? "";
      const clientIp = forwardedFor.split(",")[0]?.trim() || undefined;

      void sendCapiEvent({
        eventName: "Lead",
        eventId,
        email: data.email,
        phone: data.phone,
        eventSourceUrl: getRequestHeader("referer") ?? undefined,
        clientIp,
        clientUserAgent: getRequestHeader("user-agent") ?? undefined,
      }).catch(() => {});
    }
    return { ok: true };
  });

const conversionSchema = z.object({
  eventName: z.enum(["PageView", "Lead", "Purchase"]),
  /** Gerado no navegador e reutilizado aqui para deduplicar no Meta. */
  eventId: z.string().trim().min(6).max(120),
  eventSourceUrl: z.string().trim().max(500).optional(),
  email: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  value: z.number().nonnegative().max(1_000_000).optional(),
  contentName: z.string().trim().max(160).optional(),
  orderId: z.string().trim().max(120).optional(),
  fbp: z.string().trim().max(200).optional(),
  fbc: z.string().trim().max(200).optional(),
});

/**
 * Espelha no servidor (API de Conversões) o evento já disparado no navegador.
 * O token do Meta fica só no servidor; o retorno nunca expõe detalhes do
 * provedor. Falhas são silenciosas de propósito: rastreamento não pode
 * quebrar cadastro nem checkout.
 */
export const trackConversion = createServerFn({ method: "POST" })
  .validator((data: unknown) => conversionSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { sendCapiEvent } = await import("./capi.server");

    const forwardedFor = getRequestHeader("x-forwarded-for") ?? "";
    const clientIp = forwardedFor.split(",")[0]?.trim() || undefined;

    return sendCapiEvent({
      ...data,
      clientIp,
      clientUserAgent: getRequestHeader("user-agent") ?? undefined,
    });
  });
