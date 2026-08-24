import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/erros")({
  head: () => ({
    meta: [
      { title: "Erro — Acessar I.A" },
      {
        name: "description",
        content: "Página de erro. Algo deu errado ao processar sua solicitação.",
      },
      { property: "og:title", content: "Erro — Acessar I.A" },
      {
        property: "og:description",
        content: "Página de erro. Algo deu errado ao processar sua solicitação.",
      },
    ],
  }),
  component: ErrosPage,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="text-7xl">⚠️</div>
      <h1 className="text-3xl font-bold text-foreground">
        Erro ao carregar a página
      </h1>
      <p className="max-w-md text-muted-foreground">
        Não foi possível abrir esta página devido a um erro no código.
      </p>
      {error?.message ? (
        <pre className="max-w-lg overflow-auto rounded-lg bg-card p-4 text-left text-sm text-muted-foreground">
          {error.message}
        </pre>
      ) : null}
      <a
        href="/"
        className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
      >
        Voltar ao início
      </a>
    </div>
  ),
});

function ErrosPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="text-8xl">🚧</div>
      <h1 className="text-4xl font-extrabold text-foreground">
        Página com erros
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Esta página está cheia de erros no código ao ponto de não conseguir
        abrir. Estamos trabalhando para corrigir isso o mais rápido possível.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href="/"
          className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Ir para a Home
        </a>
        <a
          href="/painel"
          className="rounded-lg border border-border px-6 py-3 font-semibold text-foreground transition hover:bg-card"
        >
          Abrir Painel
        </a>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Se o problema persistir, entre em contato pelo nosso suporte interno.
      </p>
    </div>
  );
}
