import { createServerFn } from "@tanstack/react-start";
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
});

/** Contadores internos de visita/cadastro exibidos no painel administrativo. */
export const trackSiteEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => eventSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const settings = await import("./settings.server");
    if (data.type === "pageview") settings.incrementVisits();
    else settings.incrementSignups();
    return { ok: true };
  });
