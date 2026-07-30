import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkPaymentStatus, getOrderStatusByEmail } from "@/lib/checkout.functions";
import { formatBRL } from "@/lib/plans";
import { getLatestOrder, getOrder, updateOrder, type StoredOrder } from "@/lib/order-storage";
import { trackPixelEvent } from "@/components/site/FacebookPixel";

interface PedidoSearch {
  order_nsu?: string;
  slug?: string;
  transaction_nsu?: string;
  receipt_url?: string;
  capture_method?: string;
}

export const Route = createFileRoute("/pedido")({
  validateSearch: (search: Record<string, unknown>): PedidoSearch => ({
    order_nsu: typeof search.order_nsu === "string" ? search.order_nsu : undefined,
    slug: typeof search.slug === "string" ? search.slug : undefined,
    transaction_nsu:
      typeof search.transaction_nsu === "string" ? search.transaction_nsu : undefined,
    receipt_url: typeof search.receipt_url === "string" ? search.receipt_url : undefined,
    capture_method: typeof search.capture_method === "string" ? search.capture_method : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Meu pedido — POPULAR" },
      {
        name: "description",
        content:
          "Acompanhe em tempo real a confirmação do pagamento e a entrega do seu impulsionamento no POPULAR.",
      },
      { property: "og:title", content: "Meu pedido — POPULAR" },
      {
        property: "og:description",
        content: "Confirmação de pagamento em tempo real e prazo de entrega de até 6 horas.",
      },
    ],
  }),
  component: PedidoPage,
});

function PedidoPage() {
  const search = Route.useSearch();
  const [order, setOrder] = useState<StoredOrder | undefined>();
  const check = useServerFn(checkPaymentStatus);
  const statusByEmail = useServerFn(getOrderStatusByEmail);

  // localStorage só existe no cliente: leitura após a hidratação.
  useEffect(() => {
    const found = search.order_nsu ? getOrder(search.order_nsu) : getLatestOrder();
    if (found && (search.slug || search.transaction_nsu)) {
      updateOrder(found.orderNsu, {
        slug: search.slug,
        transactionNsu: search.transaction_nsu,
        receiptUrl: search.receipt_url,
        captureMethod: search.capture_method,
      });
    }
    setOrder(found ? { ...found, slug: search.slug ?? found.slug } : undefined);
  }, [search.order_nsu, search.slug, search.transaction_nsu, search.receipt_url, search.capture_method]);

  const orderNsu = order?.orderNsu ?? search.order_nsu ?? "";

  const status = useQuery({
    queryKey: ["payment-status", orderNsu, search.slug, search.transaction_nsu],
    enabled: Boolean(orderNsu),
    refetchInterval: (query) => (query.state.data?.paid ? false : 5000),
    queryFn: () =>
      check({
        data: {
          orderNsu,
          slug: search.slug ?? order?.slug ?? "",
          transactionNsu: search.transaction_nsu ?? order?.transactionNsu ?? "",
        },
      }),
  });

  // Fallback: se a consulta direta ainda não confirmou, verificamos pelo
  // e-mail — é assim que o pagamento aparece quando o cliente fechou a aba do
  // checkout e só o webhook (nome do produto) confirmou a venda.
  const email = order?.customerEmail ?? "";
  const byEmail = useQuery({
    queryKey: ["payment-status-email", email],
    enabled: Boolean(email) && status.data?.paid !== true,
    refetchInterval: (query) => (query.state.data?.paid ? false : 7000),
    queryFn: () => statusByEmail({ data: { customerEmail: email } }),
  });

  const paid = status.data?.paid === true || byEmail.data?.paid === true;

  // Purchase é disparado uma única vez, quando o pagamento é confirmado.
  useEffect(() => {
    if (!paid || !order) return;
    trackPixelEvent("Purchase", {
      value: order.priceCents / 100,
      contentName: order.planName,
      orderId: order.orderNsu,
      email: order.customerEmail,
      phone: order.customerPhone,
    });

  }, [paid, order]);


  return (
    <main className="bg-aurora min-h-screen px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar para os planos
        </Link>

        <div className="glass-panel mt-6 rounded-3xl p-6 md:p-10">
          <h1 className="text-2xl font-extrabold md:text-3xl">Painel do seu pedido</h1>

          {!orderNsu ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhum pedido encontrado neste navegador. Escolha um plano para começar.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Pedido <span className="text-foreground font-mono">{orderNsu}</span>
              </p>

              <div className="mt-8 flex items-start gap-4 rounded-2xl border border-border p-5">
                {paid ? (
                  <CheckCircle2 className="text-success mt-0.5 size-6 shrink-0" aria-hidden="true" />
                ) : (
                  <Loader2
                    className="text-primary mt-0.5 size-6 shrink-0 animate-spin"
                    aria-hidden="true"
                  />
                )}
                <div>
                  <p className="font-bold">
                    {paid ? "Pagamento aprovado!" : "Aguardando confirmação do pagamento"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {paid
                      ? "Seu pedido entrou na fila de entrega. O resultado começa a aparecer no perfil em até 6 horas."
                      : "Assim que a InfinitePay confirmar, esta tela atualiza sozinha em tempo real."}
                  </p>
                </div>
              </div>

              {order ? (
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Info label="Plano" value={order.planName} />
                  <Info label="Valor" value={formatBRL(order.priceCents)} />
                  <Info label="Perfil" value={order.profileUrl} />
                  <Info label="Região" value={order.region} />
                  <Info
                    label="Prazo de entrega"
                    value="Até 6 horas após a aprovação"
                  />
                </dl>
              ) : null}

              <ol className="mt-8 space-y-4">
                <Step
                  done
                  title="Pedido cadastrado"
                  description="Recebemos os dados do seu perfil e da sua campanha."
                />
                <Step
                  done={paid}
                  title="Pagamento confirmado"
                  description={
                    paid
                      ? "InfinitePay aprovou o pagamento."
                      : "Aguardando aprovação da InfinitePay."
                  }
                />
                <Step
                  done={false}
                  title="Entrega em andamento"
                  description="Nossa equipe inicia a entrega e o resultado aparece no perfil em até 6 horas."
                />
              </ol>

              <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3.5" aria-hidden="true" />
                Verificação automática a cada 5 segundos.
              </p>

              {order?.receiptUrl ? (
                <Button asChild variant="outline" className="mt-4 w-full">
                  <a href={order.receiptUrl} target="_blank" rel="noopener noreferrer">
                    Ver comprovante
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-sm break-all">{value}</dd>
    </div>
  );
}

interface StepProps {
  done: boolean;
  title: string;
  description: string;
}

function Step({ done, title, description }: StepProps) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={
          done
            ? "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success/20 text-success"
            : "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground"
        }
        aria-hidden="true"
      >
        {done ? <CheckCircle2 className="size-4" /> : <Clock className="size-3.5" />}
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </li>
  );
}
