import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { OrderRecord } from "./orders-repo.server";

/**
 * Server functions do painel administrativo.
 *
 * Toda função exige a senha do admin, validada no servidor contra o secret
 * ADMIN_PASSWORD. Nenhuma autorização acontece no cliente.
 */

const passwordSchema = z.object({
  password: z.string().min(1, "Informe a senha").max(200),
});

const deliverSchema = passwordSchema.extend({
  orderNsu: z.string().trim().min(1).max(120),
  action: z.enum(["entregue", "reabrir"]),
});

const adminTicketSchema = passwordSchema.extend({
  orderNsu: z.string().trim().min(1).max(120),
  text: z.string().trim().min(2, "Mensagem muito curta").max(2000),
});


export type AdminOrder = OrderRecord;

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => passwordSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { isAdminPassword } = await import("./orders-repo.server");
    if (!isAdminPassword(data.password)) {
      throw new Error("Senha incorreta.");
    }
    return { ok: true };
  });

export const adminListOrders = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => passwordSchema.parse(data))
  .handler(async ({ data }): Promise<AdminOrder[]> => {
    const repo = await import("./orders-repo.server");
    if (!repo.isAdminPassword(data.password)) {
      throw new Error("Não autorizado.");
    }
    return repo.listOrders();
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => deliverSchema.parse(data))
  .handler(async ({ data }): Promise<AdminOrder[]> => {
    const repo = await import("./orders-repo.server");
    if (!repo.isAdminPassword(data.password)) {
      throw new Error("Não autorizado.");
    }
    const changed =
      data.action === "entregue"
        ? repo.markDelivered(data.orderNsu)
        : repo.markReopened(data.orderNsu);
    if (!changed) {
      throw new Error("Pedido não encontrado.");
    }
    return repo.listOrders();
  });
