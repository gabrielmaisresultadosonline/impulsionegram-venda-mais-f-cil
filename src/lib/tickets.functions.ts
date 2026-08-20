import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { OrderRecord } from "./orders-repo.server";

/**
 * Server functions do ticket de suporte (lado cliente / usuário).
 *
 * Não exigem senha: o usuário acessa apenas o pedido que está salvo no
 * próprio navegador. A validação é pela posse do `orderNsu` + dados básicos
 * do pedido (e-mail + NSU), sem expor segredos.
 */

const customerTicketSchema = z.object({
  orderNsu: z.string().trim().min(1).max(120),
  customerEmail: z.string().trim().email().min(1).max(120),
  text: z.string().trim().min(2, "Mensagem muito curta").max(2000),
});

export type CustomerOrder = OrderRecord;

export const customerListOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        orderNsu: z.string().trim().min(1).max(120),
        customerEmail: z.string().trim().email().min(1).max(120),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<CustomerOrder | null> => {
    const repo = await import("./orders-repo.server");
    const order = await repo.getOrderByNsu(data.orderNsu);
    if (!order || order.customerEmail.toLowerCase() !== data.customerEmail.toLowerCase()) {
      return null;
    }
    return order;
  });

export const customerSendMessage = createServerFn({ method: "POST" })
  .validator((data: unknown) => customerTicketSchema.parse(data))
  .handler(async ({ data }): Promise<CustomerOrder | null> => {
    const repo = await import("./orders-repo.server");
    const order = await repo.getOrderByNsu(data.orderNsu);
    if (!order || order.customerEmail.toLowerCase() !== data.customerEmail.toLowerCase()) {
      throw new Error("Pedido não encontrado.");
    }
    await repo.addMessage(data.orderNsu, {
      author: "customer",
      text: data.text,
      readByAdmin: false,
    });
    return (await repo.getOrderByNsu(data.orderNsu)) ?? null;
  });

/**
 * Lista todos os pedidos de um e-mail para a seção "Meus pedidos" do painel.
 * A posse é validada pelo e-mail salvo na conta local do navegador.
 */
export const customerListOrdersByEmail = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ customerEmail: z.string().trim().email().min(1).max(160) }).parse(data),
  )
  .handler(async ({ data }): Promise<CustomerOrder[]> => {
    const allOrders = await repo.listOrders();
    const target = data.customerEmail.toLowerCase();
    return allOrders.filter(
      (order: any) =>
        order.customerEmail.trim().toLowerCase() === target && !order.cancelledAt,
    );
  });

/**
 * Apaga um pedido pendente (não pago) do histórico do cliente.
 * Pedidos pagos ou entregues são protegidos e nunca removidos aqui.
 */
export const customerDeleteOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        orderNsu: z.string().trim().min(1).max(120),
        customerEmail: z.string().trim().email().min(1).max(160),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ deleted: boolean }> => {
    const repo = await import("./orders-repo.server");
    return { deleted: await repo.deleteUnpaidOrder(data.orderNsu, data.customerEmail) };
  });
