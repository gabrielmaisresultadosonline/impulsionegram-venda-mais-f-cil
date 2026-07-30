import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { Hero } from "@/components/site/Hero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { OrderForm } from "@/components/site/OrderForm";
import { PlanCard } from "@/components/site/PlanCard";
import { PLANS } from "@/lib/plans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Impulsionegram — Seguidores e engajamento filtrados por região" },
      {
        name: "description",
        content:
          "Ganhe popularidade para o seu negócio com seguidores brasileiros filtrados por região e pelo perfil do concorrente. Planos a partir de R$14, entrega em até 6 horas.",
      },
      {
        property: "og:title",
        content: "Impulsionegram — Seguidores e engajamento filtrados por região",
      },
      {
        property: "og:description",
        content:
          "Escolha o plano, envie até 5 publicações, pague via InfinitePay e acompanhe a entrega no seu painel.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(PLANS[2].id);
  const plansRef = useRef<HTMLDivElement>(null);

  const scrollToPlans = useCallback(() => {
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSelect = useCallback((planId: string) => {
    setSelectedPlanId(planId);
    document.getElementById("pedido")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <main className="min-h-screen">
      <Hero onCta={scrollToPlans} />

      <section ref={plansRef} className="px-4 py-20" id="planos">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-extrabold text-balance md:text-4xl">
            Planos <span className="text-gradient-brand">simples e diretos</span>
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Todos os pacotes incluem filtro por região e entrega em até 6 horas após a confirmação
            do pagamento.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={plan.id === selectedPlanId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />
      <OrderForm selectedPlanId={selectedPlanId} />

      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3">
          <p className="text-center text-xs text-muted-foreground">
            Impulsionegram · Pagamentos processados pela InfinitePay · Resultados iniciam em até 6
            horas após a aprovação.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/pedido" className="text-muted-foreground hover:text-foreground">
              Acompanhar meu pedido
            </Link>
            <Link to="/admin" className="text-muted-foreground hover:text-foreground">
              Administração
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
