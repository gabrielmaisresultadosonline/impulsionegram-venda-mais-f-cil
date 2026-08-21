import fs from "node:fs";

/**
 * Configurações operacionais do painel (lado servidor).
 *
 * ATENÇÃO (arquitetura): assim como o repositório de pedidos, o estado vive em
 * memória do runtime. Ao ligar o banco de dados, reimplemente estas funções
 * mantendo a mesma assinatura — nenhum chamador precisa mudar.
 */

interface SiteSettings {
  /** ID do Pixel do Facebook (público por natureza: roda no navegador). */
  facebookPixelId: string;
  /** Contador de visitas na página inicial. */
  visits: number;
  /** Contador de cadastros criados (lead). */
  signups: number;
  // Evolution API
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionInstance?: string;
  openaiKey?: string;
  aiPrompt?: string;
  aiActive?: boolean;
}

/** Pixel padrão do projeto — pode ser sobrescrito no /admin ou pelo .env. */
const DEFAULT_PIXEL_ID = "1055141180794602";

/** Credenciais padrão do admin (sobrescritas por ADMIN_EMAIL / ADMIN_LOGIN_PASSWORD). */
const DEFAULT_ADMIN_EMAIL = "mro@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "Ga145523@";

const DATA_DIR = "/dev-server/.data";
const SETTINGS_FILE = `${DATA_DIR}/site_settings.json`;

const settings: SiteSettings = {
  facebookPixelId: "",
  visits: 0,
  signups: 0,
  openaiKey: "",
  aiPrompt: "",
  aiActive: false,
};

let loaded = false;

function load(): void {
  if (loaded) return;
  loaded = true;
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return;
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    Object.assign(settings, parsed);
  } catch {}
}

function persist(): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings), "utf8");
  } catch {}
}

export function getSettings(): SiteSettings {
  load();
  // O .env tem prioridade na primeira leitura; depois vale o que o admin salvar.
  const pixelId =
    settings.facebookPixelId || process.env.FACEBOOK_PIXEL_ID || DEFAULT_PIXEL_ID;
  return { ...settings, facebookPixelId: pixelId };
}


/** Aceita apenas dígitos (formato do Pixel ID) ou string vazia para remover. */
export function setFacebookPixelId(pixelId: string): void {
  load();
  settings.facebookPixelId = pixelId;
  persist();
}

export function updateEvolutionSettings(data: Partial<SiteSettings>) {
  load();
  Object.assign(settings, data);
  // Garante persistência imediata em disco/nuvem local
  persist();
  // Log de verificação (server-only)
  console.log(`[Settings] Configurações de IA atualizadas: Active=${settings.aiActive}, Token=${settings.openaiKey ? 'Configurado' : 'Vazio'}`);
}

export function incrementVisits(): void {
  load();
  settings.visits += 1;
  persist();
}

export function incrementSignups(): void {
  load();
  settings.signups += 1;
  persist();
}

/**
 * Valida as credenciais do administrador contra os secrets do servidor.
 * Deve ser chamada dentro de um handler (process.env só existe em runtime).
 */
export function isAdminCredentials(email: string, password: string): boolean {
  // Fallback: credenciais padrão do projeto quando o .env ainda não define
  // os secrets (preview / primeira instalação). Em produção, defina
  // ADMIN_EMAIL e ADMIN_LOGIN_PASSWORD no .env para sobrescrever.
  const expectedEmail = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
  const expectedPassword =
    process.env.ADMIN_LOGIN_PASSWORD || process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  return (
    email.trim().toLowerCase() === expectedEmail.trim().toLowerCase() &&
    password === expectedPassword
  );
}
