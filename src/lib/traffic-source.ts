/**
 * Origem de tráfego (funil por nicho).
 *
 * Cada landing page envia um identificador curto que é gravado no cadastro e
 * no pedido, permitindo ao admin saber por onde veio o lead e a venda.
 */

export type TrafficSource = "home" | "salaode" | "barbea" | "terapi" | "whats";

const LABELS: Record<TrafficSource, string> = {
  home: "Home (global)",
  salaode: "Salão de Beleza",
  barbea: "Barbearia",
  terapi: "Terapeutas",
  whats: "WhatsApp",
};

/** Normaliza qualquer valor recebido para uma origem conhecida. */
export function normalizeSource(value: unknown): TrafficSource {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw in LABELS ? (raw as TrafficSource) : "home";
}

/** Rótulo legível exibido no painel administrativo. */
export function sourceLabel(value: unknown): string {
  return LABELS[normalizeSource(value)];
}
