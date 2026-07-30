/**
 * Integração com a API de Conversões (CAPI) do Meta.
 *
 * Por que existe: bloqueadores de anúncio e o iOS derrubam boa parte dos
 * eventos disparados só pelo navegador. Enviando o mesmo evento também pelo
 * servidor — com o mesmo `event_id` — o Meta faz a deduplicação automática e a
 * atribuição fica próxima de 100%.
 *
 * Este arquivo é SERVER-ONLY (sufixo `.server`): o token nunca chega ao
 * navegador. Ele é lido de `process.env` dentro da função, nunca no escopo do
 * módulo (as variáveis só existem em runtime).
 */

export type CapiEventName = "PageView" | "Lead" | "Purchase";

export interface CapiEventInput {
  /** Nome padrão do evento no Meta. */
  eventName: CapiEventName;
  /** Mesmo ID usado no navegador — é o que permite a deduplicação. */
  eventId: string;
  /** URL onde o evento aconteceu. */
  eventSourceUrl?: string;
  /** E-mail do cliente (será convertido em hash SHA-256 antes do envio). */
  email?: string;
  /** Telefone só com dígitos (também vai em hash). */
  phone?: string;
  /** Valor da compra em reais (apenas para Purchase). */
  value?: number;
  /** Nome do plano / conteúdo relacionado. */
  contentName?: string;
  /** Identificador do pedido, usado como order_id no Purchase. */
  orderId?: string;
  /** IP e user-agent do visitante, melhoram a taxa de correspondência. */
  clientIp?: string;
  clientUserAgent?: string;
  /** Cookies _fbp / _fbc capturados no navegador. */
  fbp?: string;
  fbc?: string;
}

const GRAPH_VERSION = "v21.0";

/** Normaliza + gera o hash SHA-256 exigido pelo Meta para dados pessoais. */
async function hashPii(value: string | undefined): Promise<string | undefined> {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Envia o evento para o Meta. Nunca lança: uma falha de rastreamento não pode
 * derrubar um cadastro ou um checkout. Erros ficam apenas no log do servidor.
 */
export async function sendCapiEvent(input: CapiEventInput): Promise<{ ok: boolean }> {
  const token = process.env.FACEBOOK_CAPI_TOKEN;
  const pixelId = process.env.FACEBOOK_PIXEL_ID;
  const testCode = process.env.FACEBOOK_TEST_EVENT_CODE;

  if (!token || !pixelId) return { ok: false };

  const userData: Record<string, unknown> = {};
  const hashedEmail = await hashPii(input.email);
  const hashedPhone = await hashPii(input.phone?.replace(/\D/g, ""));
  if (hashedEmail) userData.em = [hashedEmail];
  if (hashedPhone) userData.ph = [hashedPhone];
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  const customData: Record<string, unknown> = {};
  if (typeof input.value === "number") {
    customData.value = input.value;
    customData.currency = "BRL";
  }
  if (input.contentName) customData.content_name = input.contentName;
  if (input.orderId) customData.order_id = input.orderId;

  const payload = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        event_source_url: input.eventSourceUrl,
        action_source: "website",
        user_data: userData,
        custom_data: customData,
      },
    ],
    ...(testCode ? { test_event_code: testCode } : {}),
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      // Só o servidor vê o detalhe do provedor; o cliente recebe { ok: false }.
      console.error(`[CAPI] falha ${response.status}: ${await response.text()}`);
      return { ok: false };
    }
    return { ok: true };
  } catch (error) {
    console.error("[CAPI] erro de rede:", error);
    return { ok: false };
  }
}
