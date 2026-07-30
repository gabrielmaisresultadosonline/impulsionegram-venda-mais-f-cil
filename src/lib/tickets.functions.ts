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
  .inputValidator((data: unknown) =>
    z
      .object({
        orderNsu: z.string().trim().min(1).max(120),
        customerEmail: z.string().trim().email().min(1).max(120),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<CustomerOrder | null> => {
    const repo = await import("./orders-repo.server");
    const order = repo.getOrderByNsu(data.orderNsu);
    if (!order || order.customerEmail !== data.customerEmail) {
      return null;
    }
    return order;
  });

export const customerSendMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => customerTicketSchema.parse(data))
  .handler(async ({ data }): Promise<CustomerOrder | null> => {
    const repo = await import("./orders-repo.server");
    const order = repo.getOrderByNsu(data.orderNsu);
    if (!order || order.customerEmail !== data.customerEmail) {
      throw new Error("Pedido não encontrado.");
    }
    repo.addMessage(data.orderNsu, {
      author: "customer",
      text: data.text,
      readByAdmin: false,
    });
    return repo.getOrderByNsu(data.orderNsu) ?? null;
  });
