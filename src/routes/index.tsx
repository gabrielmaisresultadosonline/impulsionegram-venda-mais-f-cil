import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Sparkles, MapPin, Target, Users } from "lucide-react";
import { Hero } from "@/components/site/Hero";
import { SignupDialog } from "@/components/site/SignupDialog";
import { PlanCard } from "@/components/site/PlanCard";
import { Button } from "@/components/ui/button";
import { getAdsPlans } from "@/lib/plans";
import { trackSiteEvent } from "@/lib/pixel.functions";

/**
 * Rota para a landing page focada em anúncios (/ads01).
 */


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Faça seus anúncios no automático — Facebook, Instagram e WhatsApp",
      },
      {
        name: "description",
        content:
          "Anúncios automáticos para Facebook, Instagram e WhatsApp. Alcance até 100 mil contas mensalmente com gestão inclusa.",
      },
      {
        property: "og:title",
        content: "Faça seus anúncios no automático — POPULAR",
      },
      {
        property: "og:description",
        content: "Gestão e anúncios inclusos. Comece a vender mais agora.",
      },
    ],
  }),
  component: AdsLandingPage,
});

function AdsLandingPage() {
  const [signupOpen, setSignupOpen] = useState(false);
  const adsPlans = getAdsPlans();

  useEffect(() => {
    void trackSiteEvent({ data: { type: "pageview", source: "ads01" } });
  }, []);

  const openSignup = useCallback(() => setSignupOpen(true), []);

  return (
    <main className="min-h-screen">
      <Hero
        onCta={openSignup}
        onSecondary={openSignup}
        headline={["Faça seus anúncios", "no automático"]}
        highlight="Facebook, Instagram e WhatsApp no piloto automático."
        description="Mande o link da sua propaganda, selecione a região no mapa e deixe a gestão com a gente. Resultados reais para o seu negócio."
        ctaLabel="Cadastre-se grátis"
        secondaryLabel="Ver planos de anúncios"
      />

      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl grid gap-8 md:grid-cols-3">
          <div className="glass-panel p-6 rounded-2xl text-center space-y-3">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
              <Users className="text-primary size-6" />
            </div>
            <h3 className="font-bold">Novos Públicos</h3>
            <p className="text-sm text-muted-foreground">Público quente e semelhante ao seu perfil atual.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl text-center space-y-3">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
              <Target className="text-primary size-6" />
            </div>
            <h3 className="font-bold">Mais Conversões</h3>
            <p className="text-sm text-muted-foreground">Gere leads qualificados direto para o seu WhatsApp.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl text-center space-y-3">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
              <MapPin className="text-primary size-6" />
            </div>
            <h3 className="font-bold">Filtro Geográfico</h3>
            <p className="text-sm text-muted-foreground">Selecione no mapa com raio mínimo de 40km.</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 bg-muted/30" id="planos">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl">
            Planos de <span className="text-gradient-brand">Anúncios</span>
          </h2>
          <p className="mt-4 text-muted-foreground">O valor já inclui a gestão e o crédito pago à Meta.</p>

          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {adsPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={false}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33%-16px)] lg:max-w-[340px]"
              />
            ))}
          </div>

          <Button
            size="lg"
            onClick={openSignup}
            className="bg-gradient-brand shadow-glow mt-12 h-12 px-8"
          >
            Cadastre-se grátis
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
      </section>

      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} source="ads01" />
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
