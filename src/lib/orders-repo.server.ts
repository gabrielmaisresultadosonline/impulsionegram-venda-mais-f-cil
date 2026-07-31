import fs from "node:fs";

/**
 * Repositório de pedidos (lado servidor).
 *
 * ATENÇÃO (arquitetura): este repositório mantém os pedidos em memória do
 * runtime. Ele é suficiente para operar o painel administrativo enquanto a
 * instância estiver ativa, mas NÃO é persistência definitiva — ao reiniciar o
 * servidor os registros em memória são perdidos.
 *
 * O contrato abaixo foi desenhado para ser trocado por um banco de dados
 * (Lovable Cloud) sem alterar nenhum chamador: basta reimplementar as funções
 * exportadas usando queries reais.
 */

export type OrderStatus = "tentativa" | "pago" | "entregue";

export interface TicketMessage {
  id: string;
  author: "customer" | "admin";
  text: string;
  createdAt: string;
  readByAdmin: boolean;
}

export interface OrderRecord {
  orderNsu: string;
  status: OrderStatus;
  planId: string;
  planName: string;
  priceCents: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  profileUrl: string;
  region: string;
  competitor: string;
  posts: string[];
  /** Nome do produto na InfinitePay: prefixo do plano + e-mail do cliente. */
  productName?: string;
  createdAt: string;
  /** Quando o cliente descartou o pedido pendente (soft delete: some do painel do cliente, permanece no admin). */
  cancelledAt?: string;
  paidAt?: string;
  deliveredAt?: string;
  paymentUrl?: string;
  receiptUrl?: string;
  captureMethod?: string;
  transactionNsu?: string;
  messages: TicketMessage[];
}


/** Limite defensivo para evitar crescimento ilimitado de memória. */
const MAX_RECORDS = 500;

/**
 * O registry vive no escopo do módulo para sobreviver entre requisições da
 * mesma instância do worker.
 */
const registry = new Map<string, OrderRecord>();

/* -------------------------------------------------------------------------
 * Persistência em disco (best-effort)
 *
 * Sem isso, todo reinício do serviço apaga as vendas do painel admin. Gravamos
 * um JSON simples em DATA_DIR (default: ./.data). Qualquer falha de I/O é
 * silenciada: o app continua funcionando apenas em memória.
 * ---------------------------------------------------------------------- */

const DATA_DIR = process.env.ORDERS_DATA_DIR ?? ".data";
const DATA_FILE = `${DATA_DIR}/orders.json`;
let loaded = false;

function loadFromDisk(): void {
  if (loaded) return;
  loaded = true;
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    for (const item of parsed as OrderRecord[]) {
      if (item?.orderNsu) {
        registry.set(item.orderNsu, { ...item, messages: item.messages ?? [] });
      }
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
  const keys = [...registry.keys()].slice(0, excess);
  for (const key of keys) registry.delete(key);
}

/** Registra a tentativa de compra no momento em que o link é gerado. */
export function recordAttempt(
  record: Omit<OrderRecord, "status" | "createdAt"> & Partial<Pick<OrderRecord, "createdAt">>,
): void {
  loadFromDisk();
  const existing = registry.get(record.orderNsu);
  registry.set(record.orderNsu, {
    ...existing,
    ...record,
    status: existing?.status ?? "tentativa",
    createdAt: existing?.createdAt ?? record.createdAt ?? new Date().toISOString(),
  });
  prune();
  persist();
}

/** Marca o pedido como pago (idempotente: só aplica na primeira confirmação). */
export function markPaid(orderNsu: string, patch: Partial<OrderRecord> = {}): void {
  loadFromDisk();
  const existing = registry.get(orderNsu);
  if (!existing) {
    // Pagamento chegou antes/sem tentativa registrada (ex.: reinício do worker).
    registry.set(orderNsu, {
      orderNsu,
      status: "pago",
      planId: "",
      planName: "Pedido externo",
      priceCents: patch.priceCents ?? 0,
      customerName: patch.customerName ?? "",
      customerEmail: patch.customerEmail ?? "",
      customerPhone: "",
      profileUrl: "",
      region: "",
      competitor: "",
      posts: [],
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      ...patch,
      messages: patch.messages ?? [],
    });

    prune();
  persist();
    return;
  }
  if (existing.status === "entregue") return;
  registry.set(orderNsu, {
    ...existing,
    ...patch,
    status: "pago",
    messages: patch.messages ?? existing.messages ?? [],
    paidAt: existing.paidAt ?? new Date().toISOString(),
  });
  persist();
}


/** Marca o pedido como entregue. Retorna false quando o pedido não existe. */
export function markDelivered(orderNsu: string): boolean {
  loadFromDisk();
  const existing = registry.get(orderNsu);
  if (!existing) return false;
  registry.set(orderNsu, {
    ...existing,
    status: "entregue",
    deliveredAt: new Date().toISOString(),
  });
  persist();
  return true;
}

/** Reabre um pedido entregue (correção operacional). */
export function markReopened(orderNsu: string): boolean {
  loadFromDisk();
  const existing = registry.get(orderNsu);
  if (!existing) return false;
  registry.set(orderNsu, {
    ...existing,
    status: existing.paidAt ? "pago" : "tentativa",
    deliveredAt: undefined,
  });
  persist();
  return true;
}

/** Adiciona uma mensagem ao ticket do pedido. */
export function addMessage(
  orderNsu: string,
  message: Omit<TicketMessage, "id" | "createdAt">,
): boolean {
  loadFromDisk();
  const existing = registry.get(orderNsu);
  if (!existing) return false;
  const entry: TicketMessage = {
    ...message,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  registry.set(orderNsu, {
    ...existing,
    messages: [...existing.messages, entry],
  });
  persist();
  return true;
}

/** Marca as mensagens como lidas pelo lado indicado. */
export function markMessagesRead(
  orderNsu: string,
  by: "customer" | "admin",
): boolean {
  loadFromDisk();
  const existing = registry.get(orderNsu);
  if (!existing) return false;
  registry.set(orderNsu, {
    ...existing,
    messages: existing.messages.map((msg) =>
      msg.author === (by === "admin" ? "customer" : "admin") && !msg.readByAdmin
        ? { ...msg, readByAdmin: true }
        : msg,
    ),
  });
  persist();
  return true;
}

/**
 * Marca como pago usando o nome do produto (ex.: "startcliente@gmail.com").
 * Usado quando o webhook chega sem `order_nsu` — o cliente fechou a aba antes
 * do redirect. Retorna o NSU conciliado, ou undefined quando não há match.
 */
export function markPaidByProductName(
  productName: string,
  patch: Partial<OrderRecord> = {},
): string | undefined {
  loadFromDisk();
  const target = productName.trim().toLowerCase();
  if (!target) return undefined;

  // Pega a tentativa mais recente ainda não paga com esse nome de produto.
  const match = [...registry.values()]
    .filter((order) => order.productName?.toLowerCase() === target)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .find((order) => order.status === "tentativa") ??
    [...registry.values()]
      .filter((order) => order.productName?.toLowerCase() === target)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (!match) return undefined;
  markPaid(match.orderNsu, patch);
  return match.orderNsu;
}

/** Último pedido registrado para um e-mail (fallback do painel do cliente). */
export function getLatestOrderByEmail(email: string): OrderRecord | undefined {
  loadFromDisk();
  const target = email.trim().toLowerCase();
  if (!target) return undefined;
  return [...registry.values()]
    .filter((order) => order.customerEmail.toLowerCase() === target)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/** Busca um pedido pelo NSU. */
export function getOrderByNsu(orderNsu: string): OrderRecord | undefined {
  loadFromDisk();
  return registry.get(orderNsu);
}

/**
 * Remove um pedido ainda não pago.
 *
 * Retorna false quando o pedido não existe, o e-mail não confere ou o pedido
 * já foi pago/entregue — pedidos pagos nunca podem ser apagados pelo cliente.
 */
export function deleteUnpaidOrder(orderNsu: string, customerEmail: string): boolean {
  loadFromDisk();
  const order = registry.get(orderNsu);
  if (!order) return false;
  if (order.customerEmail.trim().toLowerCase() !== customerEmail.trim().toLowerCase()) {
    return false;
  }
  if (order.status !== "tentativa") return false;
  registry.delete(orderNsu);
  persist();
  return true;
}

/** Lista todos os pedidos, do mais recente para o mais antigo. */
export function listOrders(): OrderRecord[] {
  loadFromDisk();
  return [...registry.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}


/**
 * Valida a senha do administrador contra o secret ADMIN_PASSWORD.
 * Deve ser chamada dentro de um handler (process.env só existe em runtime).
 */
export function isAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}
