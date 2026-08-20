import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1),
  visitor: z.object({
    name: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
  }).optional(),
  orderNsu: z.string().optional(),
});

export const sendMessageToAI = createServerFn({ method: "POST" })
  .validator((data: unknown) => chatSchema.parse(data))
  .handler(async ({ data }) => {
    const { getSettings } = await import("./settings.server");
    const settings = getSettings();

    if (!settings.aiActive || !settings.openaiKey) {
      return { text: "Olá! No momento nosso chat inteligente está em manutenção, mas você pode conferir nossos planos diretamente no site!" };
    }

    try {
      // Aqui seria a integração real com OpenAI usando settings.openaiKey e settings.aiPrompt
      // Por agora, simulamos a resposta da IA baseada no prompt
      return { text: `[Simulação IA] Recebi sua mensagem: "${data.message}". Como parceira oficial da Meta, a Acessar I.A garante resultados inteligentes para seu negócio!` };
    } catch (error) {
      return { text: "Desculpe, tive um problema técnico. Pode repetir?" };
    }
  });

export const adminUpdateAISettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    email: z.string().email(),
    password: z.string(),
    openaiKey: z.string().optional(),
    aiPrompt: z.string().optional(),
    aiActive: z.boolean().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { isAdminCredentials, updateEvolutionSettings, getSettings } = await import("./settings.server");
    if (!isAdminCredentials(data.email, data.password)) throw new Error("Não autorizado");

    updateEvolutionSettings({
      openaiKey: data.openaiKey,
      aiPrompt: data.aiPrompt,
      aiActive: data.aiActive,
    });

    return getSettings();
  });
