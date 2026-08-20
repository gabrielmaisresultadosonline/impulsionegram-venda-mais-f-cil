import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listEmailLogs, getLogsByOrder } from "./email-followup/logs-repo.server";
import { isAdminPassword } from "./orders-repo.server";

export const adminListEmailLogs = createServerFn({ method: "POST" })
  .validator((data: any) =>
    z.object({
      email: z.string(),
      password: z.string(),
      orderNsu: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    if (!isAdminPassword(data.password)) {
      throw new Error("Unauthorized");
    }

    if (data.orderNsu) {
      return getLogsByOrder(data.orderNsu);
    }
    return listEmailLogs();
  });
