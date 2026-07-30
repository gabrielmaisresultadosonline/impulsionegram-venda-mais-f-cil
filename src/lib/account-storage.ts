/**
 * Cadastro local do cliente (etapa 1 do funil da home).
 *
 * ATENÇÃO (segurança): enquanto não houver banco de dados, a conta fica no
 * navegador do próprio usuário. A senha NUNCA é armazenada em texto puro nem
 * enviada ao servidor — guardamos apenas um hash SHA-256 para validar o login
 * local. Ao ativar o banco de dados, troque este módulo por autenticação real.
 */

export interface LocalAccount {
  name: string;
  email: string;
  /** SHA-256 hex da senha. Nunca a senha em si. */
  passwordHash: string;
  createdAt: string;
}

const STORAGE_KEY = "impulsionegram.account.v1";

export async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getAccount(): LocalAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalAccount>;
    if (!parsed?.email || !parsed?.name) return null;
    return parsed as LocalAccount;
  } catch {
    return null;
  }
}

export function saveAccount(account: LocalAccount): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  } catch {
    // Armazenamento indisponível (modo privado): segue o fluxo sem persistir.
  }
}

export function clearAccount(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
