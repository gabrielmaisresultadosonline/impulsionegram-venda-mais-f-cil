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
    const settings = await getSettings();
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
    const { isAdminCredentials, updateEvolutionSettings } = await import("./settings.server");
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
    const settings = await getSettings();
    if (!settings.aiActive || !settings.openaiKey) {
      return { text: "Olá! Nosso agente I.A está descansando no momento. Como posso ajudar?" };
    }

    // 1. Persistir mensagem do usuário
    const orders = await listOrders();
    const customerOrder = orders.find((o: any) => o.customerEmail.toLowerCase() === data.visitor.email.toLowerCase());
    
    if (customerOrder) {
      await addMessageToOrder(customerOrder.orderNsu, { 
        author: "customer", 
        text: data.message,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        readByAdmin: false
      });
    } else {
      const vChat = await getVisitorChat(data.visitor.email);
      if (!vChat) {
        await saveVisitorChat({
          visitorId: crypto.randomUUID(),
          name: data.visitor.name,
          email: data.visitor.email,
          phone: data.visitor.phone || "",
          messages: [],
          lastMessageAt: new Date().toISOString(),
          source: "home"
        });
      }
      await addVisitorMessage(data.visitor.email, { author: "user", text: data.message });
    }

    // 2. Recuperar histórico da conversa para contexto
    const visitorChat = !customerOrder ? await getVisitorChat(data.visitor.email) : null;
    const chatHistory = customerOrder 
      ? (customerOrder.messages || []).slice(-10)
      : (visitorChat?.messages || []).slice(-10);

    const formattedHistory = chatHistory.map((m: any) => ({
      role: m.author === "user" || m.author === "customer" ? "user" : (m.author === "admin" ? "assistant" : "assistant"),
      content: m.text
    }));

    // 3. Chamar OpenAI via Lovable Gateway
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: settings.aiPrompt || "Você é um assistente prestativo." },
            ...formattedHistory,
            { role: "user", content: data.message }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Gateway error:", response.status, errorText);
        const isQuota = errorText.includes('insufficient_quota') || errorText.includes('billing_hard_limit_reached');
        const detail = isQuota ? "Saldo insuficiente na conta OpenAI." : errorText.substring(0, 50);
        return { text: `Erro técnico (OpenAI ${response.status}). Verifique seu token e saldo no admin.\n\nDetalhe: ${detail}` };
      }

      const result = await response.json();
      const aiText = result.choices[0].message.content;

      // 3. Persistir resposta da I.A
      if (customerOrder) {
        await addMessageToOrder(customerOrder.orderNsu, { 
          author: "ai", 
          text: aiText,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          readByAdmin: false
        });
      } else {
        await addVisitorMessage(data.visitor.email, { author: "ai", text: aiText });
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
    
    const visitorsData = await listVisitorChats();
    const visitors = (visitorsData || []).map((c: any) => ({
      id: c.email,
      name: c.name,
      email: c.email,
      phone: c.phone,
      messages: c.messages,
      lastMessageAt: c.lastMessageAt,
      type: 'visitor' as const
    }));
    
    const allOrders = await listOrders();
    
    const customers = allOrders
      .filter((o: any) => o.messages && o.messages.length > 0)
      .map((o: any) => ({
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
      await addMessageToOrder(data.chatId, {
        author: "admin",
        text: data.text,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        readByAdmin: true
      });
    } else {
      await addVisitorMessage(data.chatId, { author: "admin", text: data.text });
    }

    return { success: true };
  });
