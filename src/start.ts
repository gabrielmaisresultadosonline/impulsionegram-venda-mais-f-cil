import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { describeError } from "./lib/error-capture";

// Só validamos CSRF em requisições mutantes (POST/PUT/PATCH/DELETE).
// Navegações normais (GET) chegam com Sec-Fetch-Site: none e seriam bloqueadas.
const csrfMiddleware = createCsrfMiddleware({
  filter: ({ request }) => !["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase()),
  secFetchSite: ["same-origin", "same-site", "none"],
  allowRequestsWithoutOriginCheck: true,
});

const errorMiddleware = createMiddleware({ type: "request" }).server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    console.error(describeError(error));
    throw error;
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
