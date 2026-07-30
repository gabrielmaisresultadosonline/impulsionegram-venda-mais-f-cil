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
}

/** Pixel padrão do projeto — pode ser sobrescrito no /admin ou pelo .env. */
const DEFAULT_PIXEL_ID = "1055141180794602";

const settings: SiteSettings = {
  facebookPixelId: "",
  visits: 0,
  signups: 0,
};

export function getSettings(): SiteSettings {
  // O .env tem prioridade na primeira leitura; depois vale o que o admin salvar.
  const pixelId =
    settings.facebookPixelId || process.env.FACEBOOK_PIXEL_ID || DEFAULT_PIXEL_ID;
  return { ...settings, facebookPixelId: pixelId };
}


/** Aceita apenas dígitos (formato do Pixel ID) ou string vazia para remover. */
export function setFacebookPixelId(pixelId: string): void {
  settings.facebookPixelId = pixelId;
}

export function incrementVisits(): void {
  settings.visits += 1;
}

export function incrementSignups(): void {
  settings.signups += 1;
}

/**
 * Valida as credenciais do administrador contra os secrets do servidor.
 * Deve ser chamada dentro de um handler (process.env só existe em runtime).
 */
export function isAdminCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_LOGIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) return false;
  return (
    email.trim().toLowerCase() === expectedEmail.trim().toLowerCase() &&
    password === expectedPassword
  );
}
