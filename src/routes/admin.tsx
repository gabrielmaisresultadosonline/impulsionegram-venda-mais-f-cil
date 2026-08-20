import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Clock,
  Loader2,
  LockKeyhole,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/plans";
import { sourceLabel } from "@/lib/traffic-source";
import { PixelCard } from "@/components/admin/PixelCard";
import { SignupsCard } from "@/components/admin/SignupsCard";
import { ManualPurchaseCard } from "@/components/admin/ManualPurchaseCard";
import { AISettingsCard } from "@/components/admin/AISettingsCard";
import { LayoutDashboard, Users2, MessageSquare, BotIcon } from "lucide-react";

import {
  adminListOrders,
  adminLogin,
  
  adminUpdateOrder,
  adminQuickSendPurchase,
  type AdminOrder,
} from "@/lib/admin.functions";

/** Credenciais do admin mantidas apenas em memória durante a sessão. */
export interface AdminCredentials {
  email: string;
  password: string;
}

type TabKey = "todos" | "pago" | "tentativa" | "entregue" | "cadastros" | "ia" | "chats";

const TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: "pago", label: "A entregar" },
  { key: "tentativa", label: "Tentativas" },
  { key: "entregue", label: "Entregues" },
  { key: "cadastros", label: "Cadastros" },
  { key: "todos", label: "Todos" },
];

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração — POPULAR" },
      {
        name: "description",
        content:
          "Painel interno do POPULAR para acompanhar vendas pagas, tentativas de compra e pedidos a entregar.",
      },
      { property: "og:title", content: "Administração — POPULAR" },
      {
        property: "og:description",
        content: "Gestão de vendas, cadastros e entregas do POPULAR.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<AdminCredentials | null>(null);
  const login = useServerFn(adminLogin);

  const loginMutation = useMutation({
    mutationFn: (value: AdminCredentials) => login({ data: value }),
    onSuccess: (_result, value) => {
      setSession(value);
      setPassword("");
    },
    onError: (error: Error) => toast.error(error.message || "Falha ao entrar."),
  });

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    loginMutation.mutate({ email: email.trim(), password: password.trim() });
  };

  if (!session) {
    return (
      <main className="bg-aurora flex min-h-screen items-center justify-center px-4 py-16">
        <form
          onSubmit={handleLogin}
          className="glass-panel w-full max-w-sm space-y-5 rounded-3xl p-8"
        >
          <div className="bg-gradient-brand flex size-12 items-center justify-center rounded-2xl">
            <LockKeyhole className="size-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Área administrativa</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Acesso restrito à equipe POPULAR.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">E-mail</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              maxLength={160}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Senha de acesso</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              maxLength={200}
              required
            />
          </div>
          <Button
            type="submit"
            className="bg-gradient-brand shadow-glow h-11 w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Entrar
          </Button>
          <Link to="/" className="text-muted-foreground hover:text-foreground block text-center text-xs">
            ← Voltar para o site
          </Link>
        </form>
      </main>
    );
  }

  return <AdminDashboard credentials={session} onLogout={() => setSession(null)} />;
}

interface AdminDashboardProps {
  credentials: AdminCredentials;
  onLogout: () => void;
}

function AdminDashboard({ credentials, onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<TabKey>("pago");
  const listOrders = useServerFn(adminListOrders);
  const updateOrder = useServerFn(adminUpdateOrder);
  const quickSendPurchase = useServerFn(adminQuickSendPurchase);
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => listOrders({ data: credentials }),
    refetchInterval: 15000,
  });

  const mutation = useMutation({
    mutationFn: (input: { orderNsu: string; action: "entregue" | "reabrir" }) =>
      updateOrder({ data: { ...input, ...credentials } }),
    onSuccess: (orders, input) => {
      queryClient.setQueryData(["admin-orders"], orders);
      toast.success(
        input.action === "entregue" ? "Pedido marcado como entregue." : "Pedido reaberto.",
      );
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível atualizar."),
  });

  const quickPurchaseMutation = useMutation({
    mutationFn: (orderNsu: string) => quickSendPurchase({ data: { orderNsu, ...credentials } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Evento de compra enviado com sucesso.");
      } else {
        toast.error("O Meta não confirmou o evento. Verifique as credenciais no servidor.");
      }
    },
    onError: (error: Error) => toast.error(error.message || "Falha ao enviar evento."),
  });

  const orders = useMemo<AdminOrder[]>(() => ordersQuery.data ?? [], [ordersQuery.data]);

  const stats = useMemo(() => {
    const paid = orders.filter((order) => order.status !== "tentativa");
    return {
      attempts: orders.length,
      paidCount: paid.length,
      pendingDelivery: orders.filter((order) => order.status === "pago").length,
      delivered: orders.filter((order) => order.status === "entregue").length,
      revenueCents: paid.reduce((total, order) => total + order.priceCents, 0),
    };
  }, [orders]);

  const filtered = useMemo(
    () =>
      tab === "todos" || tab === "cadastros"
        ? orders
        : orders.filter((order) => order.status === tab),
    [orders, tab],
  );

  /** Agrupa os pedidos por e-mail do cliente para a aba "Cadastros". */
  const customerGroups = useMemo(() => {
    const map = new Map<string, { email: string; name: string; orders: AdminOrder[] }>();
    for (const order of orders) {
      const email = order.customerEmail.trim().toLowerCase() || "sem-email";
      const group = map.get(email) ?? { email, name: order.customerName, orders: [] };
      group.name = group.name || order.customerName;
      group.orders.push(order);
      map.set(email, group);
    }
    return [...map.values()];
  }, [orders]);

  return (
    <main className="bg-aurora min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold md:text-3xl">Painel administrativo</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Vendas, tentativas de compra e fila de entrega.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => ordersQuery.refetch()}
              disabled={ordersQuery.isFetching}
            >
              <RefreshCw
                className={cn("size-4", ordersQuery.isFetching && "animate-spin")}
                aria-hidden="true"
              />
              Atualizar
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Sair
            </Button>
          </div>

        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<ShoppingCart className="size-5" aria-hidden="true" />}
            label="Cadastros / tentativas"
            value={String(stats.attempts)}
          />
          <StatCard
            icon={<BadgeCheck className="size-5" aria-hidden="true" />}
            label="Vendas pagas"
            value={String(stats.paidCount)}
          />
          <StatCard
            icon={<Banknote className="size-5" aria-hidden="true" />}
            label="Faturamento confirmado"
            value={formatBRL(stats.revenueCents)}
          />
          <StatCard
            icon={<PackageCheck className="size-5" aria-hidden="true" />}
            label="Aguardando entrega"
            value={String(stats.pendingDelivery)}
            highlight={stats.pendingDelivery > 0}
          />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <PixelCard credentials={credentials} />
          <ManualPurchaseCard credentials={credentials} />
        </div>

        
        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Filtrar pedidos">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                "focus-visible:ring-ring rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:outline-none",
                tab === item.key
                  ? "bg-gradient-brand border-transparent text-white"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={tab === item.key}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === "cadastros" ? (
          <>
            <SignupsCard credentials={credentials} className="mt-6" />
            <section className="mt-6 space-y-4">
              <h2 className="text-lg font-bold">Pedidos por cliente</h2>
              {customerGroups.length === 0 ? (
                <div className="glass-panel text-muted-foreground rounded-2xl p-8 text-center text-sm">
                  Nenhum pedido registrado ainda.
                </div>
              ) : (
                customerGroups.map((group) => {
                  const hasNewTag = group.orders.some(o => o.source === "home");
                  return (
                    <article key={group.email} className="glass-panel rounded-2xl p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold">{group.name || "Sem nome"}</h3>
                            {hasNewTag && (
                              <Badge className="bg-blue-600 text-white border-transparent hover:bg-blue-700 animate-pulse text-[10px] h-5">
                                NOVO
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs break-all">{group.email}</p>
                          {group.orders.find(o => o.customerPhone)?.customerPhone && (
                            <p className="text-primary mt-1 text-xs font-semibold">
                              WhatsApp: {group.orders.find(o => o.customerPhone)?.customerPhone}
                            </p>
                          )}
                        </div>
                      <p className="text-muted-foreground text-xs">
                        {group.orders.length} pedido(s)
                      </p>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {group.orders.map((order) => (
                        <li
                          key={order.orderNsu}
                          className="border-border flex flex-wrap items-center gap-2 rounded-xl border p-3 text-sm"
                        >
                          <span className="font-semibold">{order.planName}</span>
                          <span className="text-muted-foreground font-mono text-xs break-all">
                            {order.orderNsu}
                          </span>
                          <StatusBadge status={order.status} />
                          <Badge variant="outline" className="border-primary/40 text-primary">
                            {sourceLabel(order.source)}
                          </Badge>
                          {order.cancelledAt ? (
                            <Badge
                              variant="outline"
                              className="text-destructive border-destructive/30"
                            >
                              Cancelado pelo cliente
                            </Badge>
                          ) : null}
                          <span className="text-muted-foreground ml-auto text-xs">
                            {formatDate(order.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    </article>
                  );
                })
              )}
            </section>
          </>
        ) : (
          <section className="mt-6 space-y-4">
            {ordersQuery.isLoading ? (
              <div className="glass-panel text-muted-foreground flex items-center gap-3 rounded-2xl p-6 text-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Carregando pedidos...
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass-panel text-muted-foreground rounded-2xl p-8 text-center text-sm">
                Nenhum pedido nesta aba por enquanto.
              </div>
            ) : (
              filtered.map((order) => (
                <OrderCard
                  key={order.orderNsu}
                  order={order}
                  busy={mutation.isPending && mutation.variables?.orderNsu === order.orderNsu}
                  sendingPixel={quickPurchaseMutation.isPending && quickPurchaseMutation.variables === order.orderNsu}
                  onDeliver={() => mutation.mutate({ orderNsu: order.orderNsu, action: "entregue" })}
                  onReopen={() => mutation.mutate({ orderNsu: order.orderNsu, action: "reabrir" })}
                  onSendPixel={() => quickPurchaseMutation.mutate(order.orderNsu)}
                />
              ))
            )}
          </section>
        )}
      </div>
    </main>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

function StatCard({ icon, label, value, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-2xl p-5",
        highlight && "ring-primary/50 shadow-glow ring-1",
      )}
    >
      <div className="text-primary flex items-center gap-2">{icon}</div>
      <p className="text-muted-foreground mt-3 text-xs tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

interface OrderCardProps {
  order: AdminOrder;
  busy: boolean;
  sendingPixel: boolean;
  onDeliver: () => void;
  onReopen: () => void;
  onSendPixel: () => void;
}

function OrderCard({ order, busy, sendingPixel, onDeliver, onReopen, onSendPixel }: OrderCardProps) {
  return (
    <article className="glass-panel rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold">{order.planName}</h2>
            {order.source === "home" && (
              <Badge className="bg-blue-600 text-white border-transparent hover:bg-blue-700 animate-pulse text-[10px] h-5">
                NOVO
              </Badge>
            )}
            <StatusBadge status={order.status} />
            {order.cancelledAt ? (
              <Badge variant="outline" className="text-destructive border-destructive/30">
                Descartado pelo cliente
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-1 font-mono text-xs">{order.orderNsu}</p>
        </div>
        <p className="text-lg font-extrabold">{formatBRL(order.priceCents)}</p>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Cliente" value={order.customerName || "—"} />
        <Field label="E-mail" value={order.customerEmail || "—"} />
        <Field label="WhatsApp" value={order.customerPhone || "—"} />
        <Field label="Perfil" value={order.profileUrl || "—"} />
        <Field label="Região" value={order.region || "—"} />
        <Field label="Concorrente" value={order.competitor || "—"} />
        <Field label="Veio de" value={sourceLabel(order.source)} />
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Link da Publicação" value={order.adLink || order.posts?.[0] || "—"} />
        </div>
        <Field label="Criado em" value={formatDate(order.createdAt)} />
        <Field label="Pago em" value={order.paidAt ? formatDate(order.paidAt) : "—"} />
        <Field
          label="Entregue em"
          value={order.deliveredAt ? formatDate(order.deliveredAt) : "—"}
        />
      </dl>

      {order.bumps && order.bumps.length > 0 ? (
        <div className="border-primary/30 bg-primary/5 mt-4 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Order bumps ({order.bumps.length})
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {order.bumps.map((bump) => (
              <li key={bump.id} className="flex justify-between gap-3">
                <span className="min-w-0 break-words">{bump.name}</span>
                <span className="shrink-0 font-semibold">{formatBRL(bump.priceCents)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-muted-foreground mt-4 text-xs">Sem order bumps neste pedido.</p>
      )}

      {order.posts.length > 0 ? (
        <div className="border-border mt-4 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Publicações ({order.posts.length}/5)
          </p>
          <ul className="mt-2 space-y-1 text-sm break-all">
            {order.posts.map((post) => (
              <li key={post}>
                <a
                  href={normalizeUrl(post)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {post}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {order.status === "pago" ? (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            disabled={busy}
            onClick={onDeliver}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Marcar entregue
          </Button>
        ) : order.status === "entregue" ? (
          <Button variant="outline" size="sm" disabled={busy} onClick={onReopen}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
            Reabrir pedido
          </Button>
        ) : null}

        {order.paidAt && (
          <Button
            variant="secondary"
            size="sm"
            className="border-primary/20 hover:bg-primary/10 border"
            disabled={sendingPixel}
            onClick={onSendPixel}
          >
            {sendingPixel ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Enviar Pixel (Purchase)
          </Button>
        )}

        {order.receiptUrl ? (
          <Button asChild variant="outline" size="sm">
            <a href={order.receiptUrl} target="_blank" rel="noopener noreferrer">
              Comprovante
            </a>
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: AdminOrder["status"] }) {
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
        <BadgeCheck className="size-3.5" aria-hidden="true" />
        Pago — entregar
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Clock className="size-3.5" aria-hidden="true" />
      Tentativa
    </Badge>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border rounded-xl border p-3">
      <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm break-all">{value}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function normalizeUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
