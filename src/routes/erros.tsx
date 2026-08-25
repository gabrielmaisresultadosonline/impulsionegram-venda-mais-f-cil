import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'

export const Route = createFileRoute('/erros')({
  head: () => ({
    meta: [
      { title: 'Erros — Impulsionegram' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: ErrosPage,
})

function ErrosPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Ops! Algo deu errado</h1>
        <p className="text-muted-foreground">
          Ocorreu um erro inesperado ao carregar esta página. Tente novamente ou
          volte para a página inicial.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  )
}
