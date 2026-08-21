import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listEmailLogs, getLogsByOrder } from "./email-followup/logs-repo.server";

export const adminListEmailLogs = createServerFn({ method: "POST" })
  .validator((data: any) =>
    z.object({
      email: z.string(),
      password: z.string(),
      orderNsu: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { isAdminCredentials } = await import("./settings.server");
    if (!isAdminCredentials(data.email, data.password)) {
      throw new Error("Unauthorized");
    }

    if (data.orderNsu) {
      return await getLogsByOrder(data.orderNsu);
    }
    return await listEmailLogs();
  });
