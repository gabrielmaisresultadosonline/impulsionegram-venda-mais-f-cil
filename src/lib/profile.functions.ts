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
  // Aceita link completo ou @handle/identificador: o objetivo é registrar,
  // não validar formato — o Admin precisa ver o que o cliente informou.
  adLink: z.string().trim().max(500).optional(),

  source: z.string().trim().max(40).optional(),
});

/**
 * Versão tolerante do schema: usada no auto-save progressivo, enquanto o
 * cliente ainda está preenchendo o quiz. Nada aqui é obrigatório além do
 * e-mail, que é a chave do cadastro.
 */
const partialProfileSchema = z.object({
  name: z.string().trim().max(160).optional(),
  email: z.string().trim().email("E-mail inválido").max(160),
  phone: z.string().trim().max(40).optional(),
  profileUrl: z.string().trim().max(200).optional(),
  region: z.string().trim().max(160).optional(),
  competitor: z.string().trim().max(200).optional(),
  adLink: z.string().trim().max(500).optional(),
  source: z.string().trim().max(40).optional(),
});

export const saveCampaignProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => profileSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { saveSignupProfile } = await import("./signups-repo.server");
    await saveSignupProfile(data);
    return { ok: true };
  });

/**
 * Auto-save progressivo do quiz: grava cada campo assim que o cliente digita,
 * mesmo que o restante ainda esteja vazio e mesmo que ele nunca pague.
 */
export const saveCampaignProfileDraft = createServerFn({ method: "POST" })
  .validator((data: unknown) => partialProfileSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { saveSignupProfileDraft } = await import("./signups-repo.server");
    await saveSignupProfileDraft(data);
    return { ok: true };
  });
