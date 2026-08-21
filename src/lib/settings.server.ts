import { supabaseAdmin } from "./supabase.server";

export interface SiteSettings {
  facebookPixelId: string;
  visits: number;
  signups: number;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionInstance?: string;
  openaiKey?: string;
  aiPrompt?: string;
  aiActive?: boolean;
}

const DEFAULT_PIXEL_ID = "1055141180794602";
const DEFAULT_ADMIN_EMAIL = "mro@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "Ga145523@";

export async function getSettings(): Promise<SiteSettings> {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('id', 'global')
    .single();

  const baseSettings: SiteSettings = {
    facebookPixelId: data?.facebook_pixel_id || process.env.FACEBOOK_PIXEL_ID || DEFAULT_PIXEL_ID,
    visits: data?.visits || 0,
    signups: data?.signups || 0,
    evolutionApiUrl: data?.evolution_api_url,
    evolutionApiKey: data?.evolution_api_key,
    evolutionInstance: data?.evolution_instance,
    openaiKey: data?.openai_key,
    aiPrompt: data?.ai_prompt,
    aiActive: data?.ai_active ?? false,
  };

  return baseSettings;
}

/**
 * Escrita segura: nunca sobrescreve colunas que não foram informadas.
 * Usamos UPDATE (merge parcial) e só criamos a linha caso ela não exista.
 */
async function writeSettings(patch: Record<string, unknown>): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from('settings')
    .select('id')
    .eq('id', 'global')
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from('settings').update(patch).eq('id', 'global');
    return;
  }

  await supabaseAdmin.from('settings').insert({ id: 'global', ...patch });
}

export async function setFacebookPixelId(pixelId: string): Promise<void> {
  await writeSettings({ facebook_pixel_id: pixelId });
}

export async function updateEvolutionSettings(data: Partial<SiteSettings>): Promise<void> {
  const mapped: Record<string, unknown> = {};
  if (data.facebookPixelId !== undefined) mapped.facebook_pixel_id = data.facebookPixelId;
  if (data.evolutionApiUrl !== undefined) mapped.evolution_api_url = data.evolutionApiUrl;
  if (data.evolutionApiKey !== undefined) mapped.evolution_api_key = data.evolutionApiKey;
  if (data.evolutionInstance !== undefined) mapped.evolution_instance = data.evolutionInstance;
  if (data.openaiKey !== undefined) mapped.openai_key = data.openaiKey;
  if (data.aiPrompt !== undefined) mapped.ai_prompt = data.aiPrompt;
  if (data.aiActive !== undefined) mapped.ai_active = data.aiActive;

  if (Object.keys(mapped).length === 0) return;
  await writeSettings(mapped);
}

export async function incrementVisits(): Promise<void> {
  const settings = await getSettings();
  await writeSettings({ visits: settings.visits + 1 });
}

export async function incrementSignups(): Promise<void> {
  const settings = await getSettings();
  await writeSettings({ signups: settings.signups + 1 });
}

export function isAdminCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
  const expectedPassword =
    process.env.ADMIN_LOGIN_PASSWORD || process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  return (
    email.trim().toLowerCase() === expectedEmail.trim().toLowerCase() &&
    password === expectedPassword
  );
}
