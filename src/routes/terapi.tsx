import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Hero } from "@/components/site/Hero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { SignupDialog } from "@/components/site/SignupDialog";
import { PlanCard } from "@/components/site/PlanCard";
import { Button } from "@/components/ui/button";
import { getTherapyPlans } from "@/lib/plans";
import { trackSiteEvent } from "@/lib/pixel.functions";

export const Route = createFileRoute("/terapi")({
  head: () => ({
    meta: [
      {
        title: "POPULAR Terapia — Mais pacientes, mais seguidores",
      },
      {
        name: "description",
        content:
          "Atraia mais pacientes para a sua terapia. Planos Marketing Completo e Trimestral 10K com seguidores filtrados por região e CEP. Ideal para terapeutas holísticos e terapeutas de todos os tipos.",
      },
      {
        property: "og:title",
        content: "POPULAR Terapia — Mais pacientes, mais seguidores",
      },
      {
        property: "og:description",
        content:
          "Cresça no Instagram e preencha sua agenda com pacientes da sua região. Pagamento seguro via InfinitePay.",
      },
    ],
  }),
  component: TherapyPage,
});

function TherapyPage() {
  const [signupOpen, setSignupOpen] = useState(false);

  useEffect(() => {
    void trackSiteEvent({ data: { type: "pageview", source: "terapi" } });
  }, []);

  const openSignup = useCallback(() => setSignupOpen(true), []);

  return (
    <main className="min-h-screen">
      <Hero
        onCta={openSignup}
        onSecondary={openSignup}
        headline={["Mais pacientes,", "Mais seguidores", "na sua Terapia!"]}
        highlight="Público filtrado por região e CEP no automático."
        description="Basta uma configuração e você faz tudo direto pelo celular. Atraia pacientes da sua cidade, região e pelo perfil do seu concorrente — sem esforço manual."
      />

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
            Planos <span className="text-gradient-brand">para terapeutas</span>
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Escolha o ideal para a sua terapia. Entrega em até 6 horas após a confirmação do pagamento.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {getTherapyPlans().map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={false}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(50%-18px)] lg:max-w-[420px]"
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
            Pronto para <span className="text-gradient-brand">lotar sua agenda?</span>
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

      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} redirectTo="/painel?source=terapi" />

      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3">
          <p className="text-center text-xs text-muted-foreground">
            POPULAR · Parceiro oficial da Meta · Pagamentos processados pela InfinitePay ·
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
