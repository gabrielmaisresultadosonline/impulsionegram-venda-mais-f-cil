import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { getPixelConfig } from "@/lib/pixel.functions";

/**
 * Carrega o Pixel do Facebook configurado no painel administrativo e dispara
 * PageView em cada navegação. Eventos de conversão (Lead / Purchase) são
 * disparados pelos fluxos correspondentes via `trackPixelEvent`.
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

    w.fbq?.("track", "PageView");
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

/** Dispara um evento padrão do Pixel, se ele estiver ativo na página. */
export function trackPixelEvent(event: "Lead" | "Purchase", params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: FbqFunction }).fbq;
  fbq?.("track", event, params);
}
