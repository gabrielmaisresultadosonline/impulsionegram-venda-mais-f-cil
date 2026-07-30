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
