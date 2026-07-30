import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Webhook público da InfinitePay.
 *
 * A InfinitePay chama esta URL quando o pagamento é aprovado. Precisamos
 * responder rapidamente (< 1s) com 200. Qualquer outra resposta faz a
 * InfinitePay reenviar o evento.
 *
 * ATENÇÃO: este endpoint é público e a InfinitePay não assina o corpo.
 * Por isso ele NÃO é fonte de verdade sozinho — o painel do pedido sempre
 * reconfirma o pagamento via POST /payment_check antes de liberar o serviço.
 */

const webhookSchema = z.object({
  invoice_slug: z.string().max(200).optional(),
  amount: z.number().optional(),
  paid_amount: z.number().optional(),
  installments: z.number().optional(),
  capture_method: z.string().max(60).optional(),
  transaction_nsu: z.string().max(200).optional(),
  order_nsu: z.string().max(200).optional(),
  receipt_url: z.string().max(500).optional(),
});

export const Route = createFileRoute("/api/public/infinitepay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const parsed = webhookSchema.safeParse(await request.json());
          if (!parsed.success) {
            return new Response("Invalid payload", { status: 400 });
          }

          // Log mínimo, sem dados pessoais do comprador.
          console.log(
            `[infinitepay] pagamento aprovado order_nsu=${parsed.data.order_nsu ?? "?"} slug=${parsed.data.invoice_slug ?? "?"}`,
          );

          if (parsed.data.order_nsu) {
            const { markPaid } = await import("@/lib/orders-repo.server");
            markPaid(parsed.data.order_nsu, {
              receiptUrl: parsed.data.receipt_url,
              captureMethod: parsed.data.capture_method,
              transactionNsu: parsed.data.transaction_nsu,
              ...(parsed.data.paid_amount ? { priceCents: parsed.data.paid_amount } : {}),
            });
          }


          return new Response("ok", { status: 200 });
        } catch {
          return new Response("Bad Request", { status: 400 });
        }
      },
    },
  },
});
