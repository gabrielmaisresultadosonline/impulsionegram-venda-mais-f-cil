import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Hero } from "@/components/site/Hero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { SignupDialog } from "@/components/site/SignupDialog";
import { PlanCard } from "@/components/site/PlanCard";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";
import { trackSiteEvent } from "@/lib/pixel.functions";

export const Route = createFileRoute("/ads01")({
  head: () => ({
    meta: [
      {
        title: "Mais vendas, Mais engajamento, Mais clientes — POPULAR",
      },
      {
        name: "description",
        content:
          "Mais Engajamento, mais clientes, mais público filtrado por região e CEP no automático. Basta uma configuração. Faça tudo direto pelo seu celular. Planos a partir de R$29, entrega em até 6 horas.",
      },
      {
        property: "og:title",
        content: "Mais vendas, Mais engajamento, Mais clientes — POPULAR",
      },
      {
        property: "og:description",
        content:
          "Escolha o plano, envie as publicações, pague via InfinitePay e acompanhe a entrega no seu painel.",
      },
    ],
  }),
  component: AdsLandingPage,
});

function AdsLandingPage() {
  const [signupOpen, setSignupOpen] = useState(false);

  // Contabiliza a visita para o painel administrativo (uma vez por carregamento).
  useEffect(() => {
    void trackSiteEvent({ data: { type: "pageview" } });
  }, []);

  const openSignup = useCallback(() => setSignupOpen(true), []);

  return (
    <main className="min-h-screen">
      <Hero onCta={openSignup} onSecondary={openSignup} />

      <section className="px-4 pb-6">
        <div className="glass-panel mx-auto flex max-w-4xl flex-col items-center gap-4 rounded-2xl p-6 text-center md:flex-row md:justify-between md:text-left">
          <p className="text-sm font-semibold text-muted-foreground md:text-base">
            Crie sua conta em menos de 1 minuto — sem cartão, sem compromisso.
          </p>
          <Button
            size="lg"
            onClick={openSignup}
            className="bg-gradient-brand shadow-glow h-12 w-full px-7 md:w-auto"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Cadastre-se grátis
          </Button>
        </div>
      </section>

      <section className="px-4 py-20" id="planos">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-extrabold text-balance md:text-4xl">
            Planos <span className="text-gradient-brand">simples e diretos</span>
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Escolha o ideal para o seu perfil. Entrega em até 6 horas após a confirmação do
            pagamento.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={false}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] lg:max-w-[300px] last:lg:w-[calc(50%-12px)] last:lg:max-w-[560px]"
              />
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              size="lg"
              onClick={openSignup}
              className="bg-gradient-brand shadow-glow h-12 px-8"
            >
              Cadastre-se grátis
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      <HowItWorks />

      <section className="px-4 pb-24">
        <div className="glass-panel mx-auto max-w-3xl rounded-3xl p-8 text-center md:p-12">
          <h2 className="text-2xl font-extrabold text-balance md:text-3xl">
            Pronto para <span className="text-gradient-brand">vender mais no automático?</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Crie sua conta grátis, escolha o plano no painel e acompanhe a entrega em tempo real.
          </p>
          <Button
            size="lg"
            onClick={openSignup}
            className="bg-gradient-brand shadow-glow mt-7 h-12 w-full px-8 sm:w-auto"
          >
            Cadastre-se grátis
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </section>

      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} source="home" />

      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3">
          <p className="text-center text-xs text-muted-foreground">
            Pagamentos processados pela InfinitePay ·
            Resultados iniciam em até 6 horas após a aprovação.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/painel" className="text-muted-foreground hover:text-foreground">
              Meu painel
            </Link>
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
