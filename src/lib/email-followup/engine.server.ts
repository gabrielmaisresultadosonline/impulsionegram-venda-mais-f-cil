import fs from "node:fs";
import { saveEmailLog } from "./logs-repo.server";
import { OrderRecord } from "../orders-repo.server";
import { listSignups } from "../signups-repo.server";

export interface FollowupConfig {
  type: 'followup_50m' | 'followup_4h' | 'followup_16h' | 'followup_last_4h';
  delayMs: number;
  subject: string;
  template: (name: string) => string;
}

const FOLLOWUPS: FollowupConfig[] = [
  {
    type: 'followup_50m',
    delayMs: 50 * 60 * 1000,
    subject: 'Nossa I.A já está pronta para você! 🚀',
    template: (name) => `
      Olá ${name.split(' ')[0]}, vi que você iniciou seu cadastro mas ainda não ativou sua I.A.
      Nossa tecnologia parceira da Meta trabalha 24h por dia para trazer clientes qualificados para o seu negócio no automático.
      Não perca a oportunidade de escalar suas vendas ainda hoje.
      Acesse agora: https://acessar.click/painel
    `
  },
  {
    type: 'followup_4h',
    delayMs: 4 * 60 * 60 * 1000,
    subject: 'O seu concorrente pode estar usando I.A agora...',
    template: (name) => `
      ${name.split(' ')[0]}, a velocidade é a alma do negócio no digital.
      Enquanto você aguarda, centenas de potenciais clientes estão vendo anúncios de outras empresas.
      Com a Acessar I.A, você retoma o controle e aparece para quem realmente quer comprar de você.
      Clique aqui e ative: https://acessar.click/painel
    `
  },
  {
    type: 'followup_16h',
    delayMs: 16 * 60 * 60 * 1000,
    subject: 'Última chamada: Sua configuração está pendente',
    template: (name) => `
      Oi ${name.split(' ')[0]}, tudo bem? Notei que sua conta na Acessar I.A ainda está aguardando ativação.
      Nossa inteligência artificial já mapeou o público da sua região, só falta o seu comando.
      Vamos colocar sua empresa no topo?
      Ativar agora: https://acessar.click/painel
    `
  },
  {
    type: 'followup_last_4h',
    delayMs: 4 * 60 * 60 * 1000,
    subject: 'Podemos te ajudar com algo?',
    template: (name) => `
      Olá ${name.split(' ')[0]}, sou da equipe de sucesso do cliente da Acessar I.A.
      Percebi que você ainda não concluiu seu pedido. Tive algum problema técnico ou dúvida?
      Responda este e-mail ou chame no WhatsApp de suporte que resolvemos para você agora mesmo.
      Link do painel: https://acessar.click/painel
    `
  }
];

const DATA_DIR = ".data";
const QUEUE_FILE = `${DATA_DIR}/followup_queue.json`;

export function addToFollowupQueue(orderNsu: string): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    let queue: { orderNsu: string; nextFollowupIndex: number; lastSentAt: string }[] = [];
    if (fs.existsSync(QUEUE_FILE)) {
      queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
    }
    
    if (queue.find(q => q.orderNsu === orderNsu)) return;

    queue.push({
      orderNsu,
      nextFollowupIndex: 0,
      lastSentAt: new Date().toISOString()
    });
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue), "utf8");
  } catch (err) {
    console.error("Erro ao adicionar à fila de followup:", err);
  }
}

export function removeFromFollowupQueue(orderNsu: string): void {
  try {
    if (!fs.existsSync(QUEUE_FILE)) return;
    let queue: any[] = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
    queue = queue.filter(q => q.orderNsu !== orderNsu);
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue), "utf8");
  } catch {}
}

export async function processFollowupQueue(getOrderByNsu: (nsu: string) => OrderRecord | undefined): Promise<void> {
  try {
    if (!fs.existsSync(QUEUE_FILE)) return;
    const queue: { orderNsu: string; nextFollowupIndex: number; lastSentAt: string }[] = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
    const now = Date.now();
    let changed = false;

    const user = process.env["SMTP_USER"];
    const pass = process.env["SMTP_PASS"];
    if (!user || !pass) return;

    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    for (const item of queue) {
      let customerEmail = "";
      let customerName = "";
      let isPaid = false;

      if (item.orderNsu.startsWith("lead:")) {
        const email = item.orderNsu.replace("lead:", "");
        const signups = await listSignups();
        const lead = signups.find((s: any) => s.email.toLowerCase() === email.toLowerCase());
        if (!lead) continue;
        customerEmail = lead.email;
        customerName = lead.name;

        const ordersFile = ".data/orders.json";
        if (fs.existsSync(ordersFile)) {
          const orders: OrderRecord[] = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
          isPaid = orders.some(o => o.customerEmail.toLowerCase() === email.toLowerCase() && o.status !== 'tentativa');
        }
      } else {
        const order = getOrderByNsu(item.orderNsu);
        if (!order) continue;
        customerEmail = order.customerEmail;
        customerName = order.customerName;
        isPaid = order.status !== 'tentativa' || !!order.cancelledAt;
      }

      if (isPaid) {
        removeFromFollowupQueue(item.orderNsu);
        changed = true;
        continue;
      }

      const followup = FOLLOWUPS[item.nextFollowupIndex];
      if (!followup) {
        removeFromFollowupQueue(item.orderNsu);
        changed = true;
        continue;
      }

      const lastSent = new Date(item.lastSentAt).getTime();
      if (now - lastSent >= followup.delayMs) {
        try {
          const firstName = customerName.split(" ")[0];
          await transporter.sendMail({
            from: `"Acessar I.A Support" <${user}>`,
            to: customerEmail,
            subject: followup.subject,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
                <h2 style="color: #0066FF;">Olá, ${firstName}!</h2>
                ${followup.template(customerName).replace(/\n/g, '<br>')}
                <br><br>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
                  Você recebeu este e-mail porque se cadastrou em acessar.click
                </div>
              </div>
            `
          });

          saveEmailLog({
            orderNsu: item.orderNsu,
            customerEmail,
            customerName,
            type: followup.type,
            subject: followup.subject,
            content: followup.template(customerName)
          });

          item.nextFollowupIndex++;
          item.lastSentAt = new Date().toISOString();
          changed = true;
        } catch (err) {
          console.error(`Erro ao enviar followup ${followup.type} para ${customerEmail}:`, err);
        }
      }
    }

    if (changed) {
      const newQueue = queue.filter(q => q.nextFollowupIndex < FOLLOWUPS.length);
      fs.writeFileSync(QUEUE_FILE, JSON.stringify(newQueue), "utf8");
    }
  } catch (err) {
    console.error("Erro ao processar fila de followup:", err);
  }
}
