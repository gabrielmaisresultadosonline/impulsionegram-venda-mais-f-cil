import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { describeError } from "./lib/error-capture";

const csrfMiddleware = createCsrfMiddleware();

const errorMiddleware = createMiddleware({ type: "request" }).server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    console.error(describeError(error));
    throw error;
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
