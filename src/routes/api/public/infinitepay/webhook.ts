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
  /** Alguns eventos trazem os itens; usamos a descrição para conciliar. */
  items: z
    .array(z.object({ description: z.string().max(300).optional() }))
    .max(20)
    .optional(),
  customer: z.object({ email: z.string().max(200).optional() }).optional(),
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
          const event = parsed.data;

          // Log mínimo, sem dados pessoais do comprador.
          console.log(
            `[infinitepay] pagamento aprovado order_nsu=${event.order_nsu ?? "?"} slug=${event.invoice_slug ?? "?"}`,
          );

          const patch = {
            receiptUrl: event.receipt_url,
            captureMethod: event.capture_method,
            transactionNsu: event.transaction_nsu,
            ...(event.paid_amount ? { priceCents: event.paid_amount } : {}),
          };

          const { markPaid, listOrders } = await import(
            "@/lib/orders-repo.server"
          );
          
          const repo = { markPaid, listOrders };

          if (event.order_nsu) {
            await repo.markPaid(event.order_nsu, patch);
          } else {
            // Sem NSU: concilia pelo nome do produto
            const productName = event.items?.find((item) => item.description)?.description;
            if (productName) {
              const target = productName.trim().toLowerCase();
              const orders = await repo.listOrders();
              const match = orders
                .filter((order) => order.productName?.toLowerCase() === target)
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .find((order) => order.status === "tentativa") ??
                orders
                  .filter((order) => order.productName?.toLowerCase() === target)
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
              
              if (match) {
                await repo.markPaid(match.orderNsu, patch);
              }
            }
          }

          return new Response("ok", { status: 200 });
        } catch {
          return new Response("Bad Request", { status: 400 });
        }
      },
    },
  },
});

