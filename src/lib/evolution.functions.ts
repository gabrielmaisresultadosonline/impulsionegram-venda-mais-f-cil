import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

    if (!settings.evolutionApiUrl || !settings.evolutionApiKey || !settings.evolutionInstance) {
      throw new Error("Evolution API não configurada.");
    }

    try {
      // Primeiro verifica o estado da instância
      const statusRes = await fetch(`${settings.evolutionApiUrl}/instance/connectionState/${settings.evolutionInstance}`, {
        method: "GET",
        headers: { apikey: settings.evolutionApiKey },
      });
      
      const statusData = await statusRes.json();
      
      // Se já estiver conectado, não pedimos o QR Code (retornamos base64 null)
      if (statusData.instance?.state === "open") {
        return { base64: null, connected: true };
      }

      // IMPORTANTE: Para garantir que um NOVO QR Code seja gerado, tentamos forçar o logout ou desconexão se estiver em estado intermediário
      // Ou simplesmente solicitamos o connect que a Evolution cuida de gerar o QR se não estiver conectado.

      // Se não estiver aberto, solicita o QR Code
      const response = await fetch(`${settings.evolutionApiUrl}/instance/connect/${settings.evolutionInstance}`, {
        method: "GET",
        headers: { apikey: settings.evolutionApiKey },
      });

      if (!response.ok) {
        // Se der erro no connect (ex: instância não existe), tentamos criar a instância novamente
        await fetch(`${settings.evolutionApiUrl}/instance/create`, {
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

        // Tenta conectar novamente após criar
        const retryResponse = await fetch(`${settings.evolutionApiUrl}/instance/connect/${settings.evolutionInstance}`, {
          method: "GET",
          headers: { apikey: settings.evolutionApiKey },
        });
        
        if (!retryResponse.ok) return { base64: null, connected: false };
        const result = await retryResponse.json();
        return { base64: result.base64 || null, code: result.code || null, connected: false };
      }

      const result = await response.json();
      // A Evolution às vezes retorna o QR no campo 'base64' ou dentro de 'qrcode.base64'
      const base64 = result.base64 || result.qrcode?.base64 || null;
      return { base64, code: result.code || null, connected: false };
    } catch (error) {
      console.error("Evolution QR Error:", error);
      return { base64: null, connected: false };
    }
  });

export { adminInstallEvolutionLocal } from "./evolution/evolution-installer.server";
