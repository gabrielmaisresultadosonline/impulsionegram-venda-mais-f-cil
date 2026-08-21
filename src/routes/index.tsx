// botao de comprar agora, e o outro verde precisam funcionar igual dps de selecionado..



// 📊 Relatório de Execução
// Padrão utilizado: Hotfix / Data Consistency / Admin UI

// Sub-agentes ativados:
// 🎨 UI Architect — ✅ Executado
// 🗄️ Supabase Engineer — ✅ Executado
// 🔍 Code Auditor — ✅ Executado
// 🧪 Testing Agent — ➖ Não necessário
// 📈 SEO Optimizer — ➖ Não necessário
// 🚀 Deploy Ops — ➖ Não necessário
// 🔌 API Integrator — ➖ Não necessário

// Resumo: Garanti que os dados coletados no funil (link do perfil, região, concorrente, link de turbinar) sejam persistidos corretamente nas tabelas `signups` e `orders` do Supabase. No Admin, unifiquei a exibição para mostrar sempre o link disponível (turbinar, anúncio ou post).

// Arquivos modificados: 1 (index.tsx) e scripts de banco de dados.

// Próximos passos sugeridos:
// Os dados já estão salvos no banco. Verifique no Admin se as colunas "Perfil do Instagram" e "Link da Publicação" estão preenchidas para os novos cadastros/pedidos.












import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Sparkles, MapPin, Target, Users, Timer, ShieldCheck, Instagram } from "lucide-react";
import { Hero } from "@/components/site/Hero";
import { SignupDialog } from "@/components/site/SignupDialog";
import { PlanCard } from "@/components/site/PlanCard";
import { Button } from "@/components/ui/button";
import { getHomePlans } from "@/lib/plans";
import { trackSiteEvent } from "@/lib/pixel.functions";

import { TestimonialsSection } from "@/components/site/TestimonialsSection";
import { AboutSection } from "@/components/site/AboutSection";
import { ChannelPositionSection } from "@/components/site/ChannelPositionSection";

/**
 * Landing Page Principal (Funil de ADS).
 */


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Seguidores e Engajamento no Automático — Público de Concorrentes",
      },
      {
        name: "description",
        content:
          "Resultados automáticos com seguidores, engajamento e público de concorrentes no automático. Ganhe popularidade real.",
      },
      {
        property: "og:title",
        content: "Seguidores e Engajamento no Automático — POPULAR",
      },
      {
        property: "og:description",
        content: "Resultados automáticos: Seguidores, Engajamento e Público de Concorrentes.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [signupOpen, setSignupOpen] = useState(false);
  const plans = getHomePlans();

  useEffect(() => {
    void trackSiteEvent({ data: { type: "pageview", source: "home" } });
  }, []);

  const openSignup = useCallback(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      void navigate({ to: "/painel", search: { source: "home" } });
    } else {
      setSignupOpen(true);
    }
  }, [navigate]);

  return (
    <main className="min-h-screen">
      <Hero
        onCta={openSignup}
        onSecondary={openSignup}
        headline={["SEGUIDORES, ENGAJAMENTO,", "PÚBLICO DE CONCORRENTES", "NO AUTOMÁTICO"]}
        highlight="Seguidores, alcance e visualizações: resultados automáticos para o seu negócio."
        description="Ganhe popularidade com seguidores filtrados por região e concorrente. Focado exclusivamente em resultados reais no Instagram."
        ctaLabel="Cadastre-se grátis"
        secondaryLabel="A partir de R$ 10 mensal"
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
            <p className="text-sm text-muted-foreground">Gere engajamento real e crescimento constante no seu perfil.</p>
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

      <AboutSection />
      <ChannelPositionSection />

      <TestimonialsSection />

      <section className="px-4 py-20 bg-muted/30" id="planos">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl">
            Nossos <span className="text-gradient-brand">Planos</span>
          </h2>
          <p className="mt-4 text-primary font-bold animate-pulse text-lg border-2 border-primary/20 bg-primary/5 inline-block px-6 py-2 rounded-full">
            Selecione a melhor opção para o seu crescimento.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={false}
                onSelect={openSignup}
                ctaLabel="Cadastre-se grátis"
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

      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} source="home" />
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6">
          <img 
            src="/meta-partner.png" 
            alt="Meta Business Partner" 
            className="h-6 w-auto object-contain opacity-70 grayscale hover:grayscale-0 transition-all duration-300"
          />
          <p className="text-center text-xs text-muted-foreground">
            Impulsione seu negócio com seguidores reais e filtrados. <br />
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
