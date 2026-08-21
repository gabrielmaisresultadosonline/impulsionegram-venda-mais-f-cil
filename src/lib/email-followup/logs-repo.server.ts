import fs from "node:fs";

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

const DATA_DIR = process.env.NODE_ENV === "production" ? "/var/www/acessarclick/.data" : ".data";
const LOG_FILE = `${DATA_DIR}/email_logs.json`;

export function saveEmailLog(log: Omit<EmailLog, 'id' | 'sentAt'>): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const logs = listEmailLogs();
    const newLog: EmailLog = {
      ...log,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sentAt: new Date().toISOString(),
    };
    logs.push(newLog);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs), "utf8");
  } catch (err) {
    console.error("Erro ao salvar log de email:", err);
  }
}

export function listEmailLogs(): EmailLog[] {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const raw = fs.readFileSync(LOG_FILE, "utf8");
    return JSON.parse(raw) as EmailLog[];
  } catch {
    return [];
  }
}

export function getLogsByOrder(orderNsu: string): EmailLog[] {
  return listEmailLogs().filter(l => l.orderNsu === orderNsu);
}
