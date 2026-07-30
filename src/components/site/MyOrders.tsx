import { type ComponentProps } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, Loader2, PackageCheck, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/plans";
import { customerListOrdersByEmail, type CustomerOrder } from "@/lib/tickets.functions";

export interface MyOrdersProps extends ComponentProps<"section"> {
  /** E-mail da conta local — chave de consulta dos pedidos no servidor. */
  customerEmail: string;
}

/**
 * Seção "Meus pedidos" do painel do cliente.
 *
 * Consulta o servidor a cada 15s para refletir pagamento confirmado e entrega
 * sem exigir refresh manual da página.
 */
export function MyOrders({ customerEmail, className, ...props }: MyOrdersProps) {
  const listOrders = useServerFn(customerListOrdersByEmail);

  const ordersQuery = useQuery({
    queryKey: ["customer-orders", customerEmail],
    enabled: Boolean(customerEmail),
    refetchInterval: 15000,
    queryFn: () => listOrders({ data: { customerEmail } }),
  });

  const orders: CustomerOrder[] = ordersQuery.data ?? [];

  return (
    <section className={cn("px-4 pb-14", className)} {...props}>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2">
          <Receipt className="text-primary size-5" aria-hidden="true" />
          <h2 className="text-xl font-extrabold">Meus pedidos</h2>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Histórico das suas compras, com data, valor e status da entrega.
        </p>

        <div className="mt-5 space-y-3">
          {ordersQuery.isLoading ? (
            <div className="glass-panel text-muted-foreground flex items-center gap-3 rounded-2xl p-5 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Carregando seus pedidos...
            </div>
          ) : orders.length === 0 ? (
            <div className="glass-panel text-muted-foreground rounded-2xl p-6 text-center text-sm">
              Você ainda não fez nenhum pedido. Escolha um plano acima para começar.
            </div>
          ) : (
            orders.map((order) => <OrderRow key={order.orderNsu} order={order} />)
          )}
        </div>
      </div>
    </section>
  );
}

function OrderRow({ order }: { order: CustomerOrder }) {
  return (
    <article className="glass-panel rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold">{order.planName}</h3>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-muted-foreground mt-1 font-mono text-xs break-all">
            {order.orderNsu}
          </p>
        </div>
        <p className="text-lg font-extrabold">{formatBRL(order.priceCents)}</p>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <Info label="Pedido feito em" value={formatDateTime(order.createdAt)} />
        <Info label="Pagamento" value={order.paidAt ? formatDateTime(order.paidAt) : "Aguardando"} />
        <Info
          label="Entrega"
          value={order.deliveredAt ? formatDateTime(order.deliveredAt) : "Em processamento"}
        />
      </dl>

      {order.profileUrl ? (
        <p className="text-muted-foreground mt-3 text-xs break-all">
          Perfil: <span className="text-foreground">{order.profileUrl}</span>
        </p>
      ) : null}
    </article>
  );
}

function OrderStatusBadge({ status }: { status: CustomerOrder["status"] }) {
  if (status === "entregue") {
    return (
      <Badge className="bg-success/15 text-success border-success/30 border">
        <PackageCheck className="size-3.5" aria-hidden="true" />
        Entregue
      </Badge>
    );
  }
  if (status === "pago") {
    return (
      <Badge className="bg-primary/15 text-primary border-primary/30 border">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Pago — em produção
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Clock className="size-3.5" aria-hidden="true" />
      Pagamento pendente
    </Badge>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border rounded-xl border p-3">
      <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
