import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Helper para tratar a resposta da Evolution API que às vezes vem como HTML ou texto
async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Evolution API retornou algo não-JSON:", text.substring(0, 100));
    if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
      throw new Error("Evolution API retornou erro HTML. Verifique se o container está rodando na porta 18080.");
    }
    throw new Error(`Resposta inválida da API: ${text.substring(0, 50)}...`);
  }
}

const credentialsSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(1).max(200),
});

const evolutionConfigSchema = credentialsSchema.extend({
  apiUrl: z.string().url("URL da API inválida").optional().or(z.literal("")),
  apiKey: z.string().max(256).optional().or(z.literal("")),
  instanceName: z.string().max(64).optional().or(z.literal("")),
  openaiKey: z.string().max(256).optional().or(z.literal("")),
  aiPrompt: z.string().max(2000).optional().or(z.literal("")),
  aiActive: z.boolean().optional(),
});

const evolutionMessageSchema = credentialsSchema.extend({
  phone: z.string().min(8).max(20),
  name: z.string().max(100),
});

async function assertAdmin(email: string, password: string): Promise<void> {
  const { isAdminCredentials } = await import("./settings.server");
  if (!isAdminCredentials(email, password)) {
    throw new Error("Não autorizado.");
  }
}

export const adminGetEvolutionConfig = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentialsSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.email, data.password);
    const { getSettings } = await import("./settings.server");
    const settings = getSettings();
    return {
      apiUrl: settings.evolutionApiUrl || "",
      apiKey: settings.evolutionApiKey || "",
      instanceName: settings.evolutionInstance || "",
      openaiKey: settings.openaiKey || "",
      aiPrompt: settings.aiPrompt || "",
      aiActive: !!settings.aiActive,
    };
  });

export const adminSaveEvolutionConfig = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => evolutionConfigSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.email, data.password);
    const { updateEvolutionSettings } = await import("./settings.server");
    updateEvolutionSettings({
      evolutionApiUrl: data.apiUrl,
      evolutionApiKey: data.apiKey,
      evolutionInstance: data.instanceName,
      openaiKey: data.openaiKey,
      aiPrompt: data.aiPrompt,
      aiActive: data.aiActive,
    });
    return { ok: true };
  });

export const adminSendEvolutionMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => evolutionMessageSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.email, data.password);
    const { getSettings } = await import("./settings.server");
    const settings = getSettings();

    if (!settings.evolutionApiUrl || !settings.evolutionApiKey || !settings.evolutionInstance) {
      throw new Error("Evolution API não configurada no painel.");
    }

    const message = `Olá ${data.name}, vi que teve uma tentativa de engajamento criado para você em nosso site, vi que não prosseguiu.\n\nEstou aguardando pronto para dar o start no seu perfil ja aqui caso gostaria de voltar ao seu cadastro e escolher um plano estamos prontos e ativos aqui !\n\nsite \n\nhttps://acessar.click/`;

    // Normaliza o telefone para o formato internacional exigido pela Evolution (ex: 5511999999999)
    const cleanPhone = data.phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    try {
      const response = await fetch(`${settings.evolutionApiUrl}/message/sendText/${settings.evolutionInstance}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: settings.evolutionApiKey,
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: message,
          delay: 1200,
          linkPreview: true,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Erro na Evolution API: ${response.status}`);
      }

      return { ok: true };
    } catch (error: any) {
      console.error("Evolution Send Error:", error);
      throw new Error(error.message || "Falha ao enviar mensagem via WhatsApp.");
    }
  });

export const adminGetEvolutionQrCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentialsSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.email, data.password);
    const { getSettings } = await import("./settings.server");
    const settings = getSettings();

    if (!settings.evolutionApiUrl && !settings.evolutionApiKey && !settings.evolutionInstance) {
      // Fallback para instalação local padrão
      settings.evolutionApiUrl = "http://localhost:18080";
      settings.evolutionApiKey = "popular-key-auto";
      settings.evolutionInstance = "PopularBot";
    }

    if (!settings.evolutionApiUrl || !settings.evolutionApiKey || !settings.evolutionInstance) {
      throw new Error("Evolution API não configurada.");
    }

    // Normalização da URL: remove barra final se existir
    const baseUrl = settings.evolutionApiUrl.replace(/\/$/, "");

    try {
      // 1. Verifica se a instância existe
      const fetchInstancesRes = await fetch(`${baseUrl}/instance/fetchInstances?instanceName=${settings.evolutionInstance}`, {
        method: "GET",
        headers: { apikey: settings.evolutionApiKey },
      });
      
      let exists = false;
      if (fetchInstancesRes.ok) {
        const instances = await fetchInstancesRes.json();
        exists = Array.isArray(instances) && instances.some((i: any) => i.instanceName === settings.evolutionInstance);
      }

      // 2. Se não existir, tenta criar
      if (!exists) {
        await fetch(`${baseUrl}/instance/create`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            apikey: settings.evolutionApiKey 
          },
          body: JSON.stringify({
            instanceName: settings.evolutionInstance,
            token: settings.evolutionApiKey,
            qrcode: true
          })
        });
        // Pequeno delay para a Evolution processar a criação
        await new Promise(r => setTimeout(r, 1000));
      }

      // 3. Verifica o estado da conexão
      const statusRes = await fetch(`${baseUrl}/instance/connectionState/${settings.evolutionInstance}`, {
        method: "GET",
        headers: { apikey: settings.evolutionApiKey },
      });
      
      let statusData: any = {};
      if (statusRes.ok) {
        statusData = await safeJsonParse(statusRes).catch(() => ({}));
      }

      if (statusData.instance?.state === "open") {
        return { base64: null, connected: true };
      }

      // 4. Solicita o QR Code
      // Tenta forçar a desconexão prévia se a requisição de connect falhar
      const response = await fetch(`${baseUrl}/instance/connect/${settings.evolutionInstance}`, {
        method: "GET",
        headers: { apikey: settings.evolutionApiKey },
      });

      if (!response.ok) {
        // Se falhar o connect, tenta um fallback para qrcode direto (versões mais novas)
        const fallbackRes = await fetch(`${baseUrl}/instance/qrcode/${settings.evolutionInstance}`, {
          method: "GET",
          headers: { apikey: settings.evolutionApiKey },
        });
        
        if (!fallbackRes.ok) {
          const errData = await safeJsonParse(fallbackRes).catch(() => ({ message: "Falha na conexão" }));
          return { base64: null, connected: false, error: errData.message || `Falha ao solicitar conexão (${response.status})` };
        }
        
        const fallbackResult = await safeJsonParse(fallbackRes);
        return { 
          base64: fallbackResult.base64 || fallbackResult.qrcode?.base64 || null, 
          code: fallbackResult.code || fallbackResult.qrcode?.code || null,
          connected: false 
        };
      }

      const result = await safeJsonParse(response);
      const base64 = result.base64 || result.qrcode?.base64 || null;
      const code = result.code || result.qrcode?.code || null;
      
      return { base64, code, connected: false };
    } catch (error: any) {
      console.error("Evolution QR Error:", error);
      return { base64: null, connected: false, error: error.message };
    }
  });

export { adminInstallEvolutionLocal } from "./evolution/evolution-installer.server";
