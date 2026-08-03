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
    
    // Simula instalação local e configura
    const localUrl = "http://localhost:8080";
    const localKey = "popular-key-" + Math.random().toString(36).substring(7);
    const localInstance = "PopularInst";

    updateEvolutionSettings({
      evolutionApiUrl: localUrl,
      evolutionApiKey: localKey,
      evolutionInstance: localInstance,
    });

    return { success: true };
  });
