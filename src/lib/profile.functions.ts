import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Salva os dados da campanha (perfil, região/CEP e concorrente) no cadastro
 * do cliente antes do pagamento. Assim, mesmo que ele não conclua a compra,
 * as informações ficam registradas e visíveis no painel administrativo.
 */

const profileSchema = z.object({
  name: z.string().trim().max(160).optional(),
  email: z.string().trim().email("E-mail inválido").max(160),
  phone: z.string().trim().max(40).optional(),
  profileUrl: z.string().trim().min(3, "Informe o link do perfil").max(200),
  region: z.string().trim().min(2, "Informe a região ou CEP").max(160),
  competitor: z.string().trim().max(200).optional(),
  adLink: z.string().trim().url("Link inválido").max(500).optional(),
  source: z.string().trim().max(40).optional(),
});

export const saveCampaignProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => profileSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { saveSignupProfile } = await import("./signups-repo.server");
    await saveSignupProfile(data);
    return { ok: true };
  });
