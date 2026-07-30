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
  createdAt: string;
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
  const existing = registry.get(record.orderNsu);
  registry.set(record.orderNsu, {
    ...existing,
    ...record,
    status: existing?.status ?? "tentativa",
    createdAt: existing?.createdAt ?? record.createdAt ?? new Date().toISOString(),
  });
  prune();
}

/** Marca o pedido como pago (idempotente: só aplica na primeira confirmação). */
export function markPaid(orderNsu: string, patch: Partial<OrderRecord> = {}): void {
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
    });
    prune();
    return;
  }
  if (existing.status === "entregue") return;
  registry.set(orderNsu, {
    ...existing,
    ...patch,
    status: "pago",
    paidAt: existing.paidAt ?? new Date().toISOString(),
  });
}

/** Marca o pedido como entregue. Retorna false quando o pedido não existe. */
export function markDelivered(orderNsu: string): boolean {
  const existing = registry.get(orderNsu);
  if (!existing) return false;
  registry.set(orderNsu, {
    ...existing,
    status: "entregue",
    deliveredAt: new Date().toISOString(),
  });
  return true;
}

/** Reabre um pedido entregue (correção operacional). */
export function markReopened(orderNsu: string): boolean {
  const existing = registry.get(orderNsu);
  if (!existing) return false;
  registry.set(orderNsu, {
    ...existing,
    status: existing.paidAt ? "pago" : "tentativa",
    deliveredAt: undefined,
  });
  return true;
}

/** Lista todos os pedidos, do mais recente para o mais antigo. */
export function listOrders(): OrderRecord[] {
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
