/**
 * Persistência local do pedido (localStorage).
 *
 * Guardamos apenas o necessário para o painel /pedido reconsultar o status
 * real na InfinitePay. Nenhum dado sensível de pagamento é armazenado.
 */

export interface StoredOrder {
  orderNsu: string;
  planId: string;
  planName: string;
  priceCents: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  profileUrl: string;
  region: string;
  posts: string[];
  createdAt: string;
  /** Preenchidos no retorno do checkout. */
  slug?: string;
  transactionNsu?: string;
  receiptUrl?: string;
  captureMethod?: string;
}


const STORAGE_KEY = "impulsionegram.orders.v1";

function readAll(): StoredOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredOrder[]) : [];
  } catch {
    return [];
  }
}

function writeAll(orders: StoredOrder[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.slice(-20)));
  } catch {
    /* storage cheio ou bloqueado: falha silenciosa, não quebra o fluxo */
  }
}

export function saveOrder(order: StoredOrder): void {
  const others = readAll().filter((item) => item.orderNsu !== order.orderNsu);
  writeAll([...others, order]);
}

export function updateOrder(orderNsu: string, patch: Partial<StoredOrder>): void {
  const orders = readAll().map((item) =>
    item.orderNsu === orderNsu ? { ...item, ...patch } : item,
  );
  writeAll(orders);
}

export function getOrder(orderNsu: string): StoredOrder | undefined {
  return readAll().find((item) => item.orderNsu === orderNsu);
}

export function getLatestOrder(): StoredOrder | undefined {
  return readAll().at(-1);
}
