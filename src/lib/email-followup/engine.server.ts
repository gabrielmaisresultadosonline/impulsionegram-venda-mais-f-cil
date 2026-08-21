import { supabaseAdmin } from "../supabase.server";
import { saveEmailLog } from "./logs-repo.server";
import { OrderRecord, getOrderByNsu } from "../orders-repo.server";
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

export async function addToFollowupQueue(orderNsu: string): Promise<void> {
  try {
    const { data: existing } = await supabaseAdmin
      .from('followup_queue')
      .select('order_nsu')
      .eq('order_nsu', orderNsu)
      .single();

    if (existing) return;

    await supabaseAdmin.from('followup_queue').insert({
      order_nsu: orderNsu,
      next_followup_index: 0,
      last_sent_at: new Date().toISOString()
    });
  } catch (err) {
    console.error("Erro ao adicionar à fila de followup no Supabase:", err);
  }
}

export async function removeFromFollowupQueue(orderNsu: string): Promise<void> {
  try {
    await supabaseAdmin.from('followup_queue').delete().eq('order_nsu', orderNsu);
  } catch (err) {
    console.error("Erro ao remover da fila de followup no Supabase:", err);
  }
}

export async function processFollowupQueue(): Promise<void> {
  try {
    const { data: queue } = await supabaseAdmin
      .from('followup_queue')
      .select('*');

    if (!queue || queue.length === 0) return;

    const now = Date.now();
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
      let isPaidOrCancelled = false;

      if (item.order_nsu.startsWith("lead:")) {
        const email = item.order_nsu.replace("lead:", "");
        const signups = await listSignups();
        const lead = signups.find((s: any) => s.email.toLowerCase() === email.toLowerCase());

        if (!lead) {
            await removeFromFollowupQueue(item.order_nsu);
            continue;
        }
        customerEmail = lead.email;
        customerName = lead.name;

        // Verifica se o lead já tem algum pedido pago
        const { data: orders } = await supabaseAdmin
            .from('orders')
            .select('status')
            .eq('customer_email', email)
            .neq('status', 'tentativa');
            
        isPaidOrCancelled = (orders && orders.length > 0);
      } else {
        const order = await getOrderByNsu(item.order_nsu);
        if (!order) {
            await removeFromFollowupQueue(item.order_nsu);
            continue;
        }
        customerEmail = order.customerEmail;
        customerName = order.customerName;
        isPaidOrCancelled = order.status !== 'tentativa' || !!order.cancelledAt;
      }

      if (isPaidOrCancelled) {
        await removeFromFollowupQueue(item.order_nsu);
        continue;
      }

      const followup = FOLLOWUPS[item.next_followup_index];
      if (!followup) {
        await removeFromFollowupQueue(item.order_nsu);
        continue;
      }

      const lastSent = new Date(item.last_sent_at).getTime();
      if (now - lastSent >= followup.delayMs) {
        try {
          const firstName = customerName.split(" ")[0];
          await transporter.sendMail({
            from: `"Acessar Click Support" <${user}>`,
            to: customerEmail,
            subject: followup.subject,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
                <h2 style="color: #00f2fe; background-color: #000; padding: 10px; text-align: center;">Olá, ${firstName}!</h2>
                ${followup.template(customerName).replace(/\n/g, '<br>')}
                <br><br>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
                  &copy; 2026 Acessar Click - Inteligência Artificial para Instagram<br>
                  Você recebeu este e-mail porque se cadastrou em acessar.click
                </div>
              </div>
            `
          });

          await saveEmailLog({
            orderNsu: item.order_nsu,
            customerEmail,
            customerName,
            type: followup.type,
            subject: followup.subject,
            content: followup.template(customerName)
          });

          const nextIndex = item.next_followup_index + 1;
          if (nextIndex >= FOLLOWUPS.length) {
            await removeFromFollowupQueue(item.order_nsu);
          } else {
            await supabaseAdmin.from('followup_queue').update({
              next_followup_index: nextIndex,
              last_sent_at: new Date().toISOString()
            }).eq('order_nsu', item.order_nsu);
          }
        } catch (err) {
          console.error(`Erro ao enviar followup ${followup.type} para ${customerEmail}:`, err);
        }
      }
    }
  } catch (err) {
    console.error("Erro ao processar fila de followup:", err);
  }
}
