import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSettings, updateEvolutionSettings, isAdminCredentials } from "./settings.server";
import { listOrders, addMessageToOrder } from "./orders-repo.server";
import { getVisitorChat, saveVisitorChat, addVisitorMessage, listVisitorChats } from "./chats-repo.server";

const API_GATEWAY_URL = "https://ai-gateway.lovable.app/v1";

export const getAISettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ email: z.string(), password: z.string() }).parse(data))
  .handler(async ({ data }) => {
    if (!isAdminCredentials(data.email, data.password)) throw new Error("Não autorizado");
    const settings = getSettings();
    return {
      openaiKey: settings.openaiKey || "",
      aiPrompt: settings.aiPrompt || "",
      aiActive: !!settings.aiActive,
    };
  });

export const saveAISettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ 
    email: z.string(),
    password: z.string(),
    openaiKey: z.string(),
    aiPrompt: z.string(),
    aiActive: z.boolean(),
  }).parse(data))
  .handler(async ({ data }) => {
    if (!isAdminCredentials(data.email, data.password)) throw new Error("Não autorizado");
    updateEvolutionSettings({
      openaiKey: data.openaiKey,
      aiPrompt: data.aiPrompt,
      aiActive: data.aiActive,
    });
    return { success: true };
  });

export const sendMessageToAI = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    message: z.string(),
    visitor: z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string().optional(),
    })
  }).parse(data))
  .handler(async ({ data }) => {
    const settings = getSettings();
    if (!settings.aiActive || !settings.openaiKey) {
      return { text: "Olá! Nosso agente I.A está descansando no momento. Como posso ajudar?" };
    }

    // 1. Persistir mensagem do usuário
    const orders = listOrders();
    const customerOrder = orders.find(o => o.customerEmail.toLowerCase() === data.visitor.email.toLowerCase());
    
    if (customerOrder) {
      addMessageToOrder(customerOrder.orderNsu, { 
        author: "customer", 
        text: data.message,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        readByAdmin: false
      });
    } else {
      let vChat = getVisitorChat(data.visitor.email);
      if (!vChat) {
        vChat = {
          visitorId: crypto.randomUUID(),
          name: data.visitor.name,
          email: data.visitor.email,
          phone: data.visitor.phone || "",
          messages: [],
          lastMessageAt: new Date().toISOString(),
          source: "home"
        };
        saveVisitorChat(vChat);
      }
      addVisitorMessage(data.visitor.email, { author: "user", text: data.message });
    }

    // 2. Chamar OpenAI via Lovable Gateway
    try {
      const response = await fetch(`${API_GATEWAY_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.openaiKey}`,
          "x-lovable-proxy": "openai"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: settings.aiPrompt || "Você é um assistente prestativo." },
            { role: "user", content: `Cliente ${data.visitor.name}: ${data.message}` }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Gateway error:", response.status, errorText);
        return { text: `Erro técnico (OpenAI ${response.status}). Verifique seu token no admin.` };
      }

      const result = await response.json();
      const aiText = result.choices[0].message.content;

      // 3. Persistir resposta da I.A
      if (customerOrder) {
        addMessageToOrder(customerOrder.orderNsu, { 
          author: "ai", 
          text: aiText,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          readByAdmin: false
        });
      } else {
        addVisitorMessage(data.visitor.email, { author: "ai", text: aiText });
      }

      return { text: aiText };
    } catch (err) {
      console.error("AI Chat error:", err);
      return { text: "Estou processando muitas informações agora. Pode me chamar em um minuto?" };
    }
  });

export const adminListAllChats = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ email: z.string(), password: z.string() }).parse(data))
  .handler(async ({ data }) => {
    if (!isAdminCredentials(data.email, data.password)) throw new Error("Não autorizado");
    
    const visitors = listVisitorChats();
    const allOrders = listOrders();
    
    const customers = allOrders
      .filter(o => o.messages && o.messages.length > 0)
      .map(o => ({
        id: o.orderNsu,
        name: o.customerName,
        email: o.customerEmail,
        phone: o.customerPhone,
        messages: o.messages,
        lastMessageAt: o.messages[o.messages.length - 1]?.createdAt,
        type: 'customer' as const
      }));

    return { visitors, customers };
  });

export const adminSendMessage = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    email: z.string(),
    password: z.string(),
    chatId: z.string(), // orderNsu ou email
    type: z.enum(['visitor', 'customer']),
    text: z.string()
  }).parse(data))
  .handler(async ({ data }) => {
    if (!isAdminCredentials(data.email, data.password)) throw new Error("Não autorizado");

    if (data.type === 'customer') {
      addMessageToOrder(data.chatId, {
        author: "admin",
        text: data.text,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        readByAdmin: true
      });
    } else {
      addVisitorMessage(data.chatId, { author: "admin", text: data.text });
    }

    return { success: true };
  });
