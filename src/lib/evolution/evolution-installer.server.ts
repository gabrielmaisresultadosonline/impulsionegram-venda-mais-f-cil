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
      // Tenta forçar a criação com parâmetros mais completos
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
          integration: "WHATSAPP-BAILEYS",
          number: ""
        }),
      });
      
      // Aguarda e tenta forçar o connect para gerar o primeiro QR
      setTimeout(async () => {
        await fetch(`${localUrl}/instance/connect/${localInstance}`, {
          method: "GET",
          headers: { apikey: localKey }
        }).catch(() => {});
      }, 2000);
    } catch (e) {
      console.error("Erro ao criar instância na Evolution:", e);
    }

    // 2. Salva nas configurações do sistema
    updateEvolutionSettings({
      evolutionApiUrl: localUrl,
      evolutionApiKey: localKey,
      evolutionInstance: localInstance,
    });

    return { success: true };
  });
