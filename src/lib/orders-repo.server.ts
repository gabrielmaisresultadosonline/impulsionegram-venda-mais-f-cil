import { supabaseAdmin } from "./supabase.server";
import { getPlanById, parseProductName, PLANS, type Plan } from "./plans";

export type OrderStatus = "tentativa" | "pago" | "entregue";

export interface TicketMessage {
  id: string;
  author: "customer" | "admin" | "ai";
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

export async function recordAttempt(
  record: Omit<OrderRecord, "status" | "createdAt" | "messages"> & Partial<Pick<OrderRecord, "createdAt">>,
): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('order_nsu', record.orderNsu)
    .single();

  const now = new Date().toISOString();
  
  const data = {
    order_nsu: record.orderNsu,
    status: existing?.status ?? "tentativa",
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
    posts: JSON.stringify(record.posts),
    bumps: JSON.stringify(record.bumps || []),
    product_name: record.productName,
    source: record.source,
    created_at: existing?.created_at ?? record.createdAt ?? now,
    messages: JSON.stringify(existing?.messages ?? [])
  };

  await supabaseAdmin.from('orders').upsert(data);
  
  if ((existing?.status ?? "tentativa") === "tentativa") {
    const { addToFollowupQueue } = await import("./email-followup/engine.server");
    addToFollowupQueue(record.orderNsu);
  }
}

export async function markPaid(orderNsu: string, patch: Partial<OrderRecord> = {}): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('order_nsu', orderNsu)
    .single();

  const now = new Date().toISOString();
  
  if (!existing) {
    const data = {
      order_nsu: orderNsu,
      status: "pago",
      plan_id: patch.planId || "",
      plan_name: patch.planName || "Pedido externo",
      price_cents: patch.priceCents || 0,
      customer_name: patch.customerName || "",
      customer_email: patch.customerEmail || "",
      customer_phone: patch.customerPhone || "",
      profile_url: patch.profileUrl || "",
      region: patch.region || "",
      created_at: now,
      paid_at: now,
      messages: JSON.stringify([])
    };
    await supabaseAdmin.from('orders').upsert(data);
  } else {
    if (existing.status === "entregue") return;
    
    await supabaseAdmin.from('orders').update({
      status: "pago",
      paid_at: existing.paid_at ?? now,
      ...patch
    }).eq('order_nsu', orderNsu);
  }

  const { data: updatedOrder } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('order_nsu', orderNsu)
    .single();

  if (updatedOrder) {
    const { removeFromFollowupQueue } = await import("./email-followup/engine.server");
    removeFromFollowupQueue(orderNsu);

    // CAPI & E-mail
    import("./capi.server").then(({ sendCapiEvent }) => {
      void sendCapiEvent({
        eventName: "Purchase",
        eventId: `purchase-${updatedOrder.order_nsu}`,
        email: updatedOrder.customer_email,
        phone: updatedOrder.customer_phone,
        value: updatedOrder.price_cents / 100,
        contentName: updatedOrder.plan_name,
        orderId: updatedOrder.order_nsu
      }).catch(err => console.error("[OrderRepo] CAPI Error:", err));
    });

    import("./transactional-emails.functions").then(({ sendTransactionalEmail }) => {
      void sendTransactionalEmail({
        data: {
          type: "payment_confirmed",
          email: updatedOrder.customer_email,
          name: updatedOrder.customer_name,
          orderNsu: updatedOrder.order_nsu,
          planName: updatedOrder.plan_name,
        }
      }).catch(err => console.error("[OrderRepo] Email Error:", err));
    });
  }
}

export async function markDelivered(orderNsu: string): Promise<boolean> {
  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('order_nsu', orderNsu)
    .single();

  if (!existing) return false;

  await supabaseAdmin.from('orders').update({
    status: "entregue",
    delivered_at: new Date().toISOString()
  }).eq('order_nsu', orderNsu);
  
  import("./transactional-emails.functions").then(({ sendTransactionalEmail }) => {
    void sendTransactionalEmail({
      data: {
        type: "delivered",
        email: existing.customer_email,
        name: existing.customer_name,
        orderNsu: existing.order_nsu,
        planName: existing.plan_name,
      }
    }).catch(err => console.error("[OrderRepo] Email Error:", err));
  });

  return true;
}

export async function listOrders(): Promise<OrderRecord[]> {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  return (data || []).map(o => ({
    orderNsu: o.order_nsu,
    status: o.status,
    planId: o.plan_id,
    planName: o.plan_name,
    priceCents: o.price_cents,
    customerName: o.customer_name,
    customerEmail: o.customer_email,
    customerPhone: o.customer_phone,
    profileUrl: o.profile_url,
    region: o.region,
    competitor: o.competitor,
    adLink: o.ad_link,
    turbinarLink: o.turbinar_link,
    posts: typeof o.posts === 'string' ? JSON.parse(o.posts) : (o.posts || []),
    bumps: typeof o.bumps === 'string' ? JSON.parse(o.bumps) : (o.bumps || []),
    productName: o.product_name,
    source: o.source,
    createdAt: o.created_at,
    cancelledAt: o.cancelled_at,
    paidAt: o.paid_at,
    deliveredAt: o.delivered_at,
    paymentUrl: o.payment_url,
    receiptUrl: o.receipt_url,
    captureMethod: o.capture_method,
    transactionNsu: o.transaction_nsu,
    messages: typeof o.messages === 'string' ? JSON.parse(o.messages) : (o.messages || [])
  }));
}

export async function getOrderByNsu(orderNsu: string): Promise<OrderRecord | undefined> {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('order_nsu', orderNsu)
    .single();
    
  if (!data) return undefined;
  
  return {
    orderNsu: data.order_nsu,
    status: data.status,
    planId: data.plan_id,
    planName: data.plan_name,
    priceCents: data.price_cents,
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    customerPhone: data.customer_phone,
    profileUrl: data.profile_url,
    region: data.region,
    competitor: data.competitor,
    adLink: data.ad_link,
    turbinarLink: data.turbinar_link,
    posts: typeof data.posts === 'string' ? JSON.parse(data.posts) : (data.posts || []),
    bumps: typeof data.bumps === 'string' ? JSON.parse(data.bumps) : (data.bumps || []),
    productName: data.product_name,
    source: data.source,
    createdAt: data.created_at,
    cancelledAt: data.cancelled_at,
    paidAt: data.paid_at,
    deliveredAt: data.delivered_at,
    paymentUrl: data.payment_url,
    receiptUrl: data.receipt_url,
    captureMethod: data.capture_method,
    transactionNsu: data.transaction_nsu,
    messages: typeof data.messages === 'string' ? JSON.parse(data.messages) : (data.messages || [])
  };
}

export function isAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || process.env.ADMIN_LOGIN_PASSWORD || "Ga145523@";
  return password === expected;
}

export async function addMessage(
  orderNsu: string,
  message: Omit<TicketMessage, "id" | "createdAt">,
): Promise<boolean> {
  const order = await getOrderByNsu(orderNsu);
  if (!order) return false;
  
  const entry: TicketMessage = {
    ...message,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  
  await supabaseAdmin.from('orders').update({
    messages: JSON.stringify([...order.messages, entry])
  }).eq('order_nsu', orderNsu);
  
  return true;
}

export async function markReopened(orderNsu: string): Promise<boolean> {
  const order = await getOrderByNsu(orderNsu);
  if (!order) return false;
  
  await supabaseAdmin.from('orders').update({
    status: order.paidAt ? "pago" : "tentativa",
    delivered_at: null
  }).eq('order_nsu', orderNsu);
  
  return true;
}

export async function deleteUnpaidOrder(orderNsu: string, customerEmail: string): Promise<boolean> {
  const order = await getOrderByNsu(orderNsu);
  if (!order) return false;
  if (order.customerEmail.trim().toLowerCase() !== customerEmail.trim().toLowerCase()) {
    return false;
  }
  if (order.status !== "tentativa") return false;
  
  await supabaseAdmin.from('orders').update({
    cancelled_at: new Date().toISOString()
  }).eq('order_nsu', orderNsu);
  
  return true;
}

export async function getLatestOrderByEmail(email: string): Promise<OrderRecord | undefined> {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('customer_email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  if (!data) return undefined;
  return getOrderByNsu(data.order_nsu);
}

export async function markPaidByProductName(
  productName: string,
  patch: Partial<OrderRecord> = {},
): Promise<string | undefined> {
  const target = productName.trim().toLowerCase();
  if (!target) return undefined;

  const orders = await listOrders();
  const match = orders
    .filter((order) => order.productName?.toLowerCase() === target)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .find((order) => order.status === "tentativa") ??
    orders
      .filter((order) => order.productName?.toLowerCase() === target)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (!match) return undefined;
  await markPaid(match.orderNsu, patch);
  return match.orderNsu;
}


export async function markMessagesRead(
  orderNsu: string,
  by: "customer" | "admin",
): Promise<boolean> {
  const order = await getOrderByNsu(orderNsu);
  if (!order) return false;
  
  const updatedMessages = order.messages.map((msg) =>
    msg.author === (by === "admin" ? "customer" : "admin") && !msg.readByAdmin
      ? { ...msg, readByAdmin: true }
      : msg
  );
  
  await supabaseAdmin.from('orders').update({
    messages: JSON.stringify(updatedMessages)
  }).eq('order_nsu', orderNsu);
  
  return true;
}
