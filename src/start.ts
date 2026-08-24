import { createStart, createCsrfMiddleware, createMiddleware } from "
export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
