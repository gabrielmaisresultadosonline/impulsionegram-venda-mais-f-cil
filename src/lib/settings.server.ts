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

export async function setFacebookPixelId(pixelId: string): Promise<void> {
  await supabaseAdmin.from('settings').upsert({
    id: 'global',
    facebook_pixel_id: pixelId
  });
}

export async function updateEvolutionSettings(data: Partial<SiteSettings>): Promise<void> {
  const mapped: any = { id: 'global' };
  if (data.facebookPixelId !== undefined) mapped.facebook_pixel_id = data.facebookPixelId;
  if (data.evolutionApiUrl !== undefined) mapped.evolution_api_url = data.evolutionApiUrl;
  if (data.evolutionApiKey !== undefined) mapped.evolution_api_key = data.evolutionApiKey;
  if (data.evolutionInstance !== undefined) mapped.evolution_instance = data.evolutionInstance;
  if (data.openaiKey !== undefined) mapped.openai_key = data.openaiKey;
  if (data.aiPrompt !== undefined) mapped.ai_prompt = data.aiPrompt;
  if (data.aiActive !== undefined) mapped.ai_active = data.aiActive;
  
  await supabaseAdmin.from('settings').upsert(mapped);
}

export async function incrementVisits(): Promise<void> {
  const settings = await getSettings();
  await supabaseAdmin.from('settings').upsert({
    id: 'global',
    visits: settings.visits + 1
  });
}

export async function incrementSignups(): Promise<void> {
  const settings = await getSettings();
  await supabaseAdmin.from('settings').upsert({
    id: 'global',
    signups: settings.signups + 1
  });
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
