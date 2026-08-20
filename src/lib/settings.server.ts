import fs from "node:fs";
import { supabaseAdmin } from "./supabase-admin.server";

/**
 * Configurações operacionais do painel (lado servidor).
 * Migrado para Lovable Cloud (Supabase).
 */

interface SiteSettings {
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

const settings: SiteSettings = {
  facebookPixelId: "",
  visits: 0,
  signups: 0,
  openaiKey: "",
  aiPrompt: "",
  aiActive: false,
};

let loaded = false;

async function loadFromCloud(): Promise<void> {
  if (loaded) return;
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('*');
    
    if (error) throw error;
    
    if (data) {
      for (const row of data) {
        (settings as any)[row.key] = row.value;
      }
    }
    loaded = true;
  } catch (err) {
    console.error("[Settings] Erro ao carregar do Cloud:", err);
    // Fallback para arquivo local se o Cloud falhar (migração/cache)
    try {
      const DATA_DIR = ".data";
      const SETTINGS_FILE = `${DATA_DIR}/site_settings.json`;
      if (fs.existsSync(SETTINGS_FILE)) {
        const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
        Object.assign(settings, JSON.parse(raw));
      }
    } catch {}
  }
}

async function persistToCloud(key: string, value: any): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    
    if (error) throw error;
  } catch (err) {
    console.error(`[Settings] Erro ao salvar ${key} no Cloud:`, err);
  }
}

export async function getSettings(): Promise<SiteSettings> {
  await loadFromCloud();
  const pixelId = settings.facebookPixelId || process.env.FACEBOOK_PIXEL_ID || DEFAULT_PIXEL_ID;
  return { ...settings, facebookPixelId: pixelId };
}

export async function setFacebookPixelId(pixelId: string): Promise<void> {
  await loadFromCloud();
  settings.facebookPixelId = pixelId;
  await persistToCloud('facebookPixelId', pixelId);
}

export async function updateEvolutionSettings(data: Partial<SiteSettings>): Promise<void> {
  await loadFromCloud();
  Object.assign(settings, data);
  
  for (const [key, value] of Object.entries(data)) {
    await persistToCloud(key, value);
  }
  
  console.log(`[Settings] Configurações de IA atualizadas e persistidas.`);
}

export async function incrementVisits(): Promise<void> {
  await loadFromCloud();
  settings.visits += 1;
  await persistToCloud('visits', settings.visits);
}

export async function incrementSignups(): Promise<void> {
  await loadFromCloud();
  settings.signups += 1;
  await persistToCloud('signups', settings.signups);
}

export function isAdminCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_LOGIN_PASSWORD || process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  return (
    email.trim().toLowerCase() === expectedEmail.trim().toLowerCase() &&
    password === expectedPassword
  );
}

