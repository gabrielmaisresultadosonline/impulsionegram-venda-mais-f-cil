import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PainelWizard } from "@/components/site/PainelWizard";
import { MyOrders } from "@/components/site/MyOrders";
import {
  clearAccount,
  getAccount,
  getPlanSelection,
  savePlanSelection,
  type LocalAccount,
} from "@/lib/account-storage";
import { PLANS, getPlanById, getSalonPlans } from "@/lib/plans";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Meu painel — POPULAR" },
      {
        name: "description",
        content:
          "Painel do cliente POPULAR: escolha seu plano, informe os dados da campanha e siga para o pagamento seguro via InfinitePay.",
      },
      { property: "og:title", content: "Meu painel — POPULAR" },
      {
        property: "og:description",
        content: "Configure sua campanha e finalize o pagamento em poucos minutos.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PainelPage,
});

function PainelPage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [ready, setReady] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(PLANS[1].id);

  useEffect(() => {
    const stored = getAccount();
    setAccount(stored);
    const plan = getPlanSelection();
    if (plan) setSelectedPlanId(plan);
    setReady(true);
  }, []);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    savePlanSelection(planId);
  };

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground text-sm">Carregando seu painel...</p>
      </main>
    );
  }

  if (!account) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel w-full max-w-md rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-extrabold">Crie sua conta primeiro</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Escolha um plano na página inicial e faça seu cadastro para acessar o painel.
          </p>
          <Button asChild size="lg" className="bg-gradient-brand shadow-glow mt-6 h-12 w-full">
            <Link to="/">Ir para a página inicial</Link>
          </Button>
        </div>
      </main>
    );
  }

  const firstName = account.name.split(" ")[0];

  return (
    <main className="min-h-screen">
      <header className="px-4 pt-14 pb-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="border-primary/40 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Painel do cliente
            </span>
            <h1 className="mt-4 text-3xl font-extrabold text-balance md:text-4xl">
              Seja bem-vindo, <span className="text-gradient-brand">{firstName}</span>!
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Escolha o seu plano, preencha as informações da campanha e siga para o pagamento.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0"
            onClick={() => {
              clearAccount();
              void navigate({ to: "/" });
            }}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </Button>
        </div>
      </header>

      <PainelWizard
        account={account}
        selectedPlanId={selectedPlanId}
        onSelectPlan={handleSelectPlan}
      />

      <MyOrders customerEmail={account.email} />

      <footer className="border-border border-t px-4 py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-4 text-xs">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            Página inicial
          </Link>
          <Link to="/pedido" className="text-muted-foreground hover:text-foreground">
            Acompanhar meu pedido
          </Link>
        </div>
      </footer>
    </main>
  );
}
