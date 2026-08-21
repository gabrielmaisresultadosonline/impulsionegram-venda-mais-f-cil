import fs from "node:fs";

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

/**
 * Persistência 100% em JSON no próprio servidor.
 * A pasta .data é preservada entre updates (ver deploy/update.sh).
 */
const DATA_DIR = process.env.ORDERS_DATA_DIR ?? ".data";
const DATA_FILE = `${DATA_DIR}/site_settings.json`;

function readFileSettings(): Partial<SiteSettings> {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as Partial<SiteSettings>;
  } catch (err) {
    console.error("[settings] Falha ao ler arquivo de configurações:", err);
    return {};
  }
}

function writeFileSettings(next: SiteSettings): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(next, null, 2), "utf8");
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[settings] Falha ao salvar configurações:", detail);
    throw new Error(`Não foi possível salvar as configurações: ${detail}`);
  }
}

export async function getSettings(): Promise<SiteSettings> {
  const data = readFileSettings();
  return {
    facebookPixelId: data.facebookPixelId || process.env.FACEBOOK_PIXEL_ID || DEFAULT_PIXEL_ID,
    visits: data.visits ?? 0,
    signups: data.signups ?? 0,
    evolutionApiUrl: data.evolutionApiUrl,
    evolutionApiKey: data.evolutionApiKey,
    evolutionInstance: data.evolutionInstance,
    openaiKey: data.openaiKey,
    aiPrompt: data.aiPrompt,
    aiActive: data.aiActive ?? false,
  };
}

/** Merge parcial: nunca apaga campos que não foram informados. */
async function writeSettings(patch: Partial<SiteSettings>): Promise<void> {
  const current = await getSettings();
  writeFileSettings({ ...current, ...patch });
}

export async function setFacebookPixelId(pixelId: string): Promise<void> {
  await writeSettings({ facebookPixelId: pixelId });
}

export async function updateEvolutionSettings(data: Partial<SiteSettings>): Promise<void> {
  const patch: Partial<SiteSettings> = {};
  if (data.facebookPixelId !== undefined) patch.facebookPixelId = data.facebookPixelId;
  if (data.evolutionApiUrl !== undefined) patch.evolutionApiUrl = data.evolutionApiUrl;
  if (data.evolutionApiKey !== undefined) patch.evolutionApiKey = data.evolutionApiKey;
  if (data.evolutionInstance !== undefined) patch.evolutionInstance = data.evolutionInstance;
  if (data.openaiKey !== undefined) patch.openaiKey = data.openaiKey;
  if (data.aiPrompt !== undefined) patch.aiPrompt = data.aiPrompt;
  if (data.aiActive !== undefined) patch.aiActive = data.aiActive;

  if (Object.keys(patch).length === 0) return;
  await writeSettings(patch);
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
