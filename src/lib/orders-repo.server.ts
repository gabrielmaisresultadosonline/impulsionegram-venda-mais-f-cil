import { supabaseAdmin } from "./supabase-admin.server";
import { addToFollowupQueue, removeFromFollowupQueue } from "./email-followup/engine.server";

/**
 * Repositório de pedidos (lado servidor).
 * Migrado para Lovable Cloud (Supabase).
 */

export type OrderStatus = "tentativa" | "pago" | "entregue";

export interface TicketMessage {
  id: string;
  author: "customer" | "admin" | "ai" | "user";
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
  adLink?: string;
  turbinarLink?: string;
  posts: string[];
  bumps?: { id: string; name: string; priceCents: number }[];
  productName?: string;
  source?: string;
  createdAt: string;
  cancelledAt?: string;
  paidAt?: string;
  deliveredAt?: string;
  paymentUrl?: string;
  receiptUrl?: string;
  captureMethod?: string;
  transactionNsu?: string;
  messages: TicketMessage[];
}

/** Registra a tentativa de compra no momento em que o link é gerado. */
export async function recordAttempt(
  record: Omit<OrderRecord, "status" | "createdAt" | "messages"> & Partial<Pick<OrderRecord, "createdAt">>,
): Promise<void> {
  const now = new Date().toISOString();
  
  const dbRecord = {
    order_nsu: record.orderNsu,
    status: "tentativa",
    plan_id: record.planId,
    plan_name: record.planName,
    price_cents: record.priceCents,
    customer_name: record.customerName,
    customer_email: record.customerEmail,
    customer_phone: record.customerPhone,
    profile_url: record.profileUrl,
    region: record.region,
    competitor: record.competitor,
    ad_link: record.adLink,
    turbinar_link: record.turbinarLink,
    posts: record.posts,
    bumps: record.bumps,
    product_name: record.productName,
    source: record.source,
    payment_url: record.paymentUrl,
    created_at: record.createdAt ?? now,
  };

  const { error } = await supabaseAdmin.from('orders').upsert(dbRecord);
  if (error) throw error;
  
  addToFollowupQueue(record.orderNsu);
}

/** Marca o pedido como pago (idempotente). */
export async function markPaid(orderNsu: string, patch: Partial<OrderRecord> = {}): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('order_nsu', orderNsu)
    .single();

  const now = new Date().toISOString();

  const update = {
    status: "pago",
    paid_at: existing?.paid_at ?? now,
    price_cents: patch.priceCents ?? existing?.price_cents,
    transaction_nsu: patch.transactionNsu ?? existing?.transaction_nsu,
    receipt_url: patch.receiptUrl ?? existing?.receipt_url,
    customer_name: patch.customerName ?? existing?.customer_name,
    customer_email: patch.customerEmail ?? existing?.customer_email,
  };

  const { error } = await supabaseAdmin
    .from('orders')
    .update(update)
    .eq('order_nsu', orderNsu);

  if (error) throw error;
  
  removeFromFollowupQueue(orderNsu);
  
  const customerEmail = patch.customerEmail ?? existing?.customer_email;
  const customerName = patch.customerName ?? existing?.customer_name;
  const priceCents = patch.priceCents ?? existing?.price_cents;
  const planName = existing?.plan_name;
  const customerPhone = existing?.customer_phone;

  if (customerEmail) {
    // CAPI Purchase
    import("./capi.server").then(({ sendCapiEvent }) => {
      void sendCapiEvent({
        eventName: "Purchase",
        eventId: `purchase-${orderNsu}`,
        email: customerEmail,
        phone: customerPhone,
        value: priceCents ? priceCents / 100 : 0,
        contentName: planName,
        orderId: orderNsu
      }).catch(err => console.error("[OrderRepo] CAPI Purchase error:", err));
    });

    // Email
    import("./transactional-emails.functions").then(({ sendTransactionalEmail }) => {
      void sendTransactionalEmail({
        data: {
          type: "payment_confirmed",
          email: customerEmail,
          name: customerName ?? "Cliente",
          orderNsu: orderNsu,
          planName: planName,
        }
      }).catch(err => console.error("[OrderRepo] Email error:", err));
    });
  }
}

/** Marca o pedido como entregue. */
export async function markDelivered(orderNsu: string): Promise<boolean> {
  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('customer_email, customer_name, plan_name')
    .eq('order_nsu', orderNsu)
    .single();

  if (!existing) return false;

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: "entregue", delivered_at: new Date().toISOString() })
    .eq('order_nsu', orderNsu);

  if (error) throw error;
  
  import("./transactional-emails.functions").then(({ sendTransactionalEmail }) => {
    void sendTransactionalEmail({
      data: {
        type: "delivered",
        email: existing.customer_email,
        name: existing.customer_name,
        orderNsu: orderNsu,
        planName: existing.plan_name,
      }
    }).catch(err => console.error("[OrderRepo] Email error:", err));
  });

  return true;
}

/** Reabre um pedido entregue. */
export async function markReopened(orderNsu: string): Promise<boolean> {
  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('paid_at')
    .eq('order_nsu', orderNsu)
    .single();

  if (!existing) return false;

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ 
      status: existing.paid_at ? "pago" : "tentativa",
      delivered_at: null 
    })
    .eq('order_nsu', orderNsu);

  if (error) throw error;
  return true;
}

/** Adiciona uma mensagem ao ticket do pedido. */
export async function addMessage(
  orderNsu: string,
  message: Omit<TicketMessage, "id" | "createdAt">,
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('order_messages')
    .insert({
      order_nsu: orderNsu,
      author: message.author,
      text: message.text,
      read_by_admin: message.readByAdmin,
      created_at: new Date().toISOString()
    });

  return !error;
}

/** Marca as mensagens como lidas. */
export async function markMessagesRead(
  orderNsu: string,
  by: "customer" | "admin",
): Promise<boolean> {
  const authorToMark = by === "admin" ? "customer" : "admin";
  const { error } = await supabaseAdmin
    .from('order_messages')
    .update({ read_by_admin: true })
    .eq('order_nsu', orderNsu)
    .eq('author', authorToMark);

  return !error;
}

/** Lista todos os pedidos. */
export async function listOrders(): Promise<OrderRecord[]> {
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (ordersError) throw ordersError;

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from('order_messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;

  const messagesMap = new Map<string, TicketMessage[]>();
  messages?.forEach(msg => {
    const list = messagesMap.get(msg.order_nsu) || [];
    list.push({
      id: msg.id,
      author: msg.author as any,
      text: msg.text,
      createdAt: msg.created_at,
      readByAdmin: msg.read_by_admin
    });
    messagesMap.set(msg.order_nsu, list);
  });

  return (orders || []).map(row => ({
    orderNsu: row.order_nsu,
    status: row.status as OrderStatus,
    planId: row.plan_id,
    planName: row.plan_name,
    priceCents: row.price_cents,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    profileUrl: row.profile_url,
    region: row.region,
    competitor: row.competitor,
    adLink: row.ad_link,
    turbinarLink: row.turbinar_link,
    posts: row.posts || [],
    bumps: row.bumps || [],
    productName: row.product_name,
    source: row.source,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
    paidAt: row.paid_at,
    deliveredAt: row.delivered_at,
    paymentUrl: row.payment_url,
    receiptUrl: row.receipt_url,
    transactionNsu: row.transaction_nsu,
    messages: messagesMap.get(row.order_nsu) || []
  }));
}

/** Atalho para addMessageToOrder (usado no ai-chat). */
export async function addMessageToOrder(orderNsu: string, message: TicketMessage) {
  return addMessage(orderNsu, {
    author: message.author,
    text: message.text,
    readByAdmin: message.readByAdmin
  });
}

/** Busca um pedido pelo NSU. */
export async function getOrderByNsu(orderNsu: string): Promise<OrderRecord | undefined> {
  const all = await listOrders();
  return all.find(o => o.orderNsu === orderNsu);
}

/** Busca último pedido por email. */
export async function getLatestOrderByEmail(email: string): Promise<OrderRecord | undefined> {
  const all = await listOrders();
  return all.find(o => o.customerEmail.toLowerCase() === email.toLowerCase());
}

/** Soft delete de pedido. */
export async function deleteUnpaidOrder(orderNsu: string, customerEmail: string): Promise<boolean> {
  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('customer_email, status')
    .eq('order_nsu', orderNsu)
    .single();

  if (!existing || existing.status !== 'tentativa') return false;
  if (existing.customer_email.toLowerCase() !== customerEmail.toLowerCase()) return false;

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('order_nsu', orderNsu);

  return !error;
}

export function isAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || process.env.ADMIN_LOGIN_PASSWORD || "Ga145523@";
  return password === expected;
}

