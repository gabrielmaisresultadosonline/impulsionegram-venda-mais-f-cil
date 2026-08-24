import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute("/erros")({
  head: () => ({
    meta: [
      { title: "Erro — Acessar I.A" },
      {
        name: "description",
        content: "Página de erro. Algo deu errado ao processar sua solicitação.",
      },
      { prop
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
      <h1 className="text-4xl font-extrabold text-foreground">Página com erros</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Esta página está cheia de erros no código ao ponto de não conseguir abrir. Estamos trabalhando para corrigir
        isso o mais rápido possível.
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
