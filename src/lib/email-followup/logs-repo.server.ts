import { supabaseAdmin } from "../supabase.server";

export interface EmailLog {
  id?: string;
  orderNsu: string;
  customerEmail: string;
  customerName: string;
  type: 'welcome' | 'followup_50m' | 'followup_4h' | 'followup_16h' | 'followup_last_4h' | 'payment_confirmed' | 'delivered';
  sentAt?: string;
  subject: string;
  content: string;
}

/**
 * Persiste logs de e-mail no Supabase.
 */
export async function saveEmailLog(log: Omit<EmailLog, 'id' | 'sentAt'>): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('email_logs').insert({
      order_nsu: log.orderNsu,
      customer_email: log.customerEmail,
      customer_name: log.customerName,
      type: log.type,
      subject: log.subject,
      content: log.content,
      sent_at: new Date().toISOString()
    });
    
    if (error) throw error;
  } catch (err) {
    console.error("[logs-repo] Erro ao salvar log no Supabase:", err);
  }
}

export async function listEmailLogs(): Promise<EmailLog[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false });
      
    if (error) throw error;
    
    return (data || []).map(row => ({
      id: row.id,
      orderNsu: row.order_nsu,
      customerEmail: row.customer_email,
      customerName: row.customer_name,
      type: row.type,
      sentAt: row.sent_at,
      subject: row.subject,
      content: row.content
    }));
  } catch (err) {
    console.error("[logs-repo] Erro ao listar logs:", err);
    return [];
  }
}

export async function getLogsByOrder(orderNsu: string): Promise<EmailLog[]> {
  const all = await listEmailLogs();
  return all.filter(l => l.orderNsu === orderNsu);
}
