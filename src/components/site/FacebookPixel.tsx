import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { getPixelConfig, trackConversion } from "@/lib/pixel.functions";

/**
 * Carrega o Pixel do Facebook configurado no painel administrativo e dispara
 * PageView em cada navegação. Todo evento é enviado duas vezes — navegador e
 * API de Conversões — com o mesmo `eventID`, para que o Meta deduplique e a
 * atribuição não se perca com bloqueadores de anúncio.
 */
export function FacebookPixel() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const { data } = useQuery({
    queryKey: ["pixel-config"],
    queryFn: () => getPixelConfig(),
    staleTime: 5 * 60 * 1000,
  });

  const pixelId = data?.pixelId ?? "";

  useEffect(() => {
    if (!pixelId || typeof window === "undefined") return;

    const w = window as unknown as { fbq?: FbqFunction; _fbq?: FbqFunction };

    if (!w.fbq) {
      // Snippet oficial do Meta Pixel, inicializado apenas quando há ID salvo.
      const fbq: FbqFunction = function (...args: unknown[]) {
        if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
        else fbq.queue.push(args);
      } as FbqFunction;
      fbq.queue = [];
      fbq.loaded = true;
      fbq.version = "2.0";
      w.fbq = fbq;
      w._fbq = fbq;

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);

      w.fbq("init", pixelId);
    }

    const eventId = createEventId();
    w.fbq?.("track", "PageView", {}, { eventID: eventId });
    void mirrorToCapi("PageView", eventId, {});
  }, [pixelId, pathname]);

  return null;
}

interface FbqFunction {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded?: boolean;
  version?: string;
}

export interface PixelEventDetails {
  email?: string;
  phone?: string;
  value?: number;
  contentName?: string;
  orderId?: string;
}

/** ID único por evento — é a chave da deduplicação navegador × servidor. */
function createEventId(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${Date.now()}-${random}`;
}

/** Lê um cookie do navegador (usado para _fbp / _fbc). */
function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Envia o mesmo evento pela API de Conversões. Nunca lança. */
async function mirrorToCapi(
  eventName: "PageView" | "Lead" | "Purchase",
  eventId: string,
  details: PixelEventDetails,
): Promise<void> {
  try {
    await trackConversion({
      data: {
        eventName,
        eventId,
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        email: details.email,
        phone: details.phone,
        value: details.value,
        contentName: details.contentName,
        orderId: details.orderId,
        fbp: readCookie("_fbp"),
        fbc: readCookie("_fbc"),
      },
    });
  } catch {
    // Rastreamento nunca pode interromper o fluxo do usuário.
  }
}

/**
 * Dispara um evento padrão do Pixel no navegador e o espelha na API de
 * Conversões com o mesmo eventID.
 */
export function trackPixelEvent(
  event: "Lead" | "Purchase",
  details: PixelEventDetails = {},
) {
  if (typeof window === "undefined") return;
  const eventId = createEventId();
  const fbq = (window as unknown as { fbq?: FbqFunction }).fbq;

  const browserParams: Record<string, unknown> = {};
  if (details.contentName) browserParams.content_name = details.contentName;
  if (typeof details.value === "number") {
    browserParams.value = details.value;
    browserParams.currency = "BRL";
  }
  if (details.orderId) browserParams.order_id = details.orderId;

  fbq?.("track", event, browserParams, { eventID: eventId });
  void mirrorToCapi(event, eventId, details);
}
