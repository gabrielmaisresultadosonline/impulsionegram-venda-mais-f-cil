import { supabaseAdmin } from "../supabase-admin.server";

export interface EmailLog {
  id: string;
  orderNsu: string;
  customerEmail: string;
  customerName: string;
  type: 'welcome' | 'followup_50m' | 'followup_4h' | 'followup_16h' | 'followup_last_4h';
  sentAt: string;
  subject: string;
  content: string;
}

export async function saveEmailLog(log: Omit<EmailLog, 'id' | 'sentAt'>): Promise<void> {
  const { error } = await supabaseAdmin.from('email_logs').insert({
    order_nsu: log.orderNsu,
    customer_email: log.customerEmail,
    customer_name: log.customerName,
    type: log.type,
    subject: log.subject,
    content: log.content,
    sent_at: new Date().toISOString()
  });

  if (error) console.error("Erro ao salvar log de email no Supabase:", error);
}

export async function listEmailLogs(): Promise<EmailLog[]> {
  const { data, error } = await supabaseAdmin
    .from('email_logs')
    .select('*')
    .order('sent_at', { ascending: false });

  if (error) {
    console.error("Erro ao listar logs de email do Supabase:", error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    orderNsu: row.order_nsu,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    type: row.type as any,
    sentAt: row.sent_at,
    subject: row.subject,
    content: row.content
  }));
}

export async function getLogsByOrder(orderNsu: string): Promise<EmailLog[]> {
  const all = await listEmailLogs();
  return all.filter(l => l.orderNsu === orderNsu);
}

