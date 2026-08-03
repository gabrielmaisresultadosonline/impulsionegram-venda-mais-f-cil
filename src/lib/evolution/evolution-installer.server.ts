import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string(),
});

async function assertAdmin(email: string, password: string): Promise<void> {
  const { isAdminCredentials } = await import("../settings.server");
  if (!isAdminCredentials(email, password)) {
    throw new Error("Não autorizado.");
  }
}

export const adminInstallEvolutionLocal = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentialsSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.email, data.password);
    const { updateEvolutionSettings } = await import("../settings.server");
    
    // Configura a aplicação para usar a instância local subida pelo script de deploy
    const localUrl = "http://localhost:18080";
    const localKey = "popular-key-auto"; // Chave definida no script de deploy
    const localInstance = "PopularBot";

    // 1. Cria a instância na Evolution API caso não exista
    try {
      // Pequeno delay para garantir que a API subiu completamente se acabamos de rodar o script
      await new Promise(resolve => setTimeout(resolve, 5000));

      const checkRes = await fetch(`${localUrl}/instance/fetchInstances?instanceName=${localInstance}`, {
        method: "GET",
        headers: { apikey: localKey },
      });
      
      let exists = false;
      if (checkRes.ok) {
        const instances = await checkRes.json();
        exists = Array.isArray(instances) && instances.some((i: any) => i.instanceName === localInstance);
      }

      if (!exists) {
        await fetch(`${localUrl}/instance/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: localKey,
          },
          body: JSON.stringify({
            instanceName: localInstance,
            token: localKey,
            qrcode: true,
            // Versão 2 pode exigir habilitar eventos
            events: ["QRCODE_UPDATED", "MESSAGES_UPSERT", "CONNECTION_UPDATE"]
          }),
        });
      }
      
      // Forçar logout para limpar estado e permitir novo login com QR
      await fetch(`${localUrl}/instance/logout/${localInstance}`, {
        method: "DELETE",
        headers: { apikey: localKey }
      }).catch(() => {});

      // Força o connect para gerar o primeiro QR
      await fetch(`${localUrl}/instance/connect/${localInstance}`, {
        method: "GET",
        headers: { apikey: localKey }
      }).catch(() => {});

    } catch (e) {
      console.error("Erro ao configurar instância local na Evolution:", e);
    }

    // 2. Salva nas configurações do sistema
    updateEvolutionSettings({
      evolutionApiUrl: localUrl,
      evolutionApiKey: localKey,
      evolutionInstance: localInstance,
    });

    return { success: true };
  });
