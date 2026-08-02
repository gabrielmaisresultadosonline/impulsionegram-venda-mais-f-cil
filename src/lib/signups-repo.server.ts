import fs from "node:fs";

/**
 * Repositório de cadastros (lado servidor).
 *
 * Mesmo contrato do repositório de pedidos: estado em memória + persistência
 * best-effort em disco, pronto para ser trocado por banco real sem mudar
 * nenhum chamador.
 */

export interface SignupRecord {
  /** E-mail é a chave natural do cadastro. */
  email: string;
  name: string;
  /** WhatsApp informado no cadastro (obrigatório na home). */
  phone?: string;
  createdAt: string;
  /** Quantas vezes o mesmo e-mail se cadastrou novamente. */
  attempts: number;
  lastSeenAt: string;
  /** Landing page de origem do cadastro (home, salaode, barbea, terapi...). */
  source?: string;
}

const MAX_RECORDS = 1000;
const registry = new Map<string, SignupRecord>();

const DATA_DIR = process.env.ORDERS_DATA_DIR ?? ".data";
const DATA_FILE = `${DATA_DIR}/signups.json`;
let loaded = false;

function loadFromDisk(): void {
  if (loaded) return;
  loaded = true;
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const parsed: unknown = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (!Array.isArray(parsed)) return;
    for (const item of parsed as SignupRecord[]) {
      if (item?.email) registry.set(item.email.toLowerCase(), item);
    }
  } catch {
    /* disco indisponível: segue apenas em memória */
  }
}

function persist(): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify([...registry.values()]), "utf8");
  } catch {
    /* disco indisponível: segue apenas em memória */
  }
}

function prune(): void {
  if (registry.size <= MAX_RECORDS) return;
  const excess = registry.size - MAX_RECORDS;
  for (const key of [...registry.keys()].slice(0, excess)) registry.delete(key);
}

/** Registra (ou atualiza) um cadastro feito na home. */
export function recordSignup(input: {
  name: string;
  email: string;
  phone?: string;
  source?: string;
}): void {
  loadFromDisk();
  const email = input.email.trim().toLowerCase();
  if (!email) return;
  const now = new Date().toISOString();
  const existing = registry.get(email);
  registry.set(email, {
    email,
    name: input.name.trim() || existing?.name || "",
    // Mantém o WhatsApp mais recente informado.
    phone: input.phone?.trim() || existing?.phone,
    createdAt: existing?.createdAt ?? now,
    attempts: (existing?.attempts ?? 0) + 1,
    lastSeenAt: now,
    // Preserva a primeira origem conhecida do lead.
    source: existing?.source ?? input.source ?? "home",
  });
  prune();
  persist();
}

/** Lista os cadastros do mais recente para o mais antigo. */
export function listSignups(): SignupRecord[] {
  loadFromDisk();
  return [...registry.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
