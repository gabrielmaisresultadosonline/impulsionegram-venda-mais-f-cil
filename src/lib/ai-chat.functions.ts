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
      // Mocked AI response using settings.openaiKey and settings.aiPrompt
      return { text: `[Acessar I.A] Recebi sua mensagem: "${data.message}". Como parceira oficial da Meta, estou aqui para impulsionar seu negócio!` };
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

export const adminListAllChats = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ email: z.string(), password: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { isAdminCredentials } = await import("./settings.server");
    if (!isAdminCredentials(data.email, data.password)) throw new Error("Não autorizado");

    const { listVisitorChats } = await import("./chats-repo.server");
    const ordersRepo = await import("./orders-repo.server");

    const visitors = listVisitorChats();
    const customers = ordersRepo.listOrders()
      .filter(o => o.messages && o.messages.length > 0)
      .map(o => ({
        id: o.orderNsu,
        name: o.customerName,
        email: o.customerEmail,
        phone: o.customerPhone,
        messages: o.messages,
        lastMessageAt: o.messages[o.messages.length - 1]?.createdAt,
        type: 'customer' as const,
        status: o.status
      }));

    return { visitors, customers };
  });
