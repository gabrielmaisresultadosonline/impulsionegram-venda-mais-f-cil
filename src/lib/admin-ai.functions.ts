import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string(),
});

const aiSettingsSchema = credentialsSchema.extend({
  openaiKey: z.string().optional(),
  aiPrompt: z.string().optional(),
  aiActive: z.boolean().optional(),
});

async function assertAdmin(email: string, password: string): Promise<void> {
  const { isAdminCredentials } = await import("./settings.server");
  if (!isAdminCredentials(email, password)) {
    throw new Error("Não autorizado.");
  }
}

export const adminUpdateAiSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => aiSettingsSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.email, data.password);
    const { updateEvolutionSettings, getSettings } = await import("./settings.server");
    
    await updateEvolutionSettings({
      openaiKey: data.openaiKey,
      aiPrompt: data.aiPrompt,
      aiActive: data.aiActive,
    });
    
    return getSettings();
  });