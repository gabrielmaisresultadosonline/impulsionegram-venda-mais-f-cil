import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/erros')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/erros"!</div>
}
