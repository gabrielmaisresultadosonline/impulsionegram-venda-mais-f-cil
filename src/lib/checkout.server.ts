/**
 * Helpers server-only do checkout.
 *
 * Ficam fora do arquivo `.functions.ts` porque o transform de server functions
 * remove os irmãos do módulo e um helper declarado ao lado do handler quebraria
 * em runtime com ReferenceError.
 */

/** Mantém apenas o origin (protocolo + host) de uma URL confiável em https. */
export function safeOrigin(rawOrigin: string): string | null {
  try {
    const url = new URL(rawOrigin);
    if (url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Normaliza o WhatsApp para o formato aceito pela InfinitePay (somente dígitos,
 * DDD + número, 10 ou 11 dígitos). Retorna `null` quando o número é inválido —
 * nesse caso o checkout segue sem telefone em vez de falhar (a API responde
 * 422 "not a valid phone number" e o cliente ficaria sem link de pagamento).
 */
export function normalizePhone(rawPhone: string): string | null {
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  if (digits.length === 11 && digits[2] !== "9") return null;
  if (digits.length < 10 || digits.length > 11) return null;
  if (digits[0] === "0" || Number(digits.slice(0, 2)) < 11) return null;
  return digits;
}
