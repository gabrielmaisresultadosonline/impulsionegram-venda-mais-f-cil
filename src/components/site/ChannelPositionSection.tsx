import { CheckCircle2, Instagram, Target, Settings2, Sparkles } from "lucide-react";

export function ChannelPositionSection() {
  return (
    <section className="px-4 py-20 bg-background overflow-hidden">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-extrabold md:text-4xl tracking-tight">
            Posicionamentos <span className="text-gradient-brand">Exclusivos</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A Acessar I.A é focada 100% no seu <span className="text-foreground font-semibold">Instagram</span>, utilizando a rede da Meta para atrair seguidores e engajamento real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Instagram Feed */}
          <div className="glass-panel p-8 rounded-3xl space-y-6 relative group border-primary/10 hover:border-primary/30 transition-all duration-500">
            <div className="absolute -top-4 -right-4 bg-gradient-brand p-3 rounded-2xl shadow-glow opacity-20 group-hover:opacity-100 transition-opacity">
              <Instagram className="text-white size-6" />
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-pink-500/10 p-2 rounded-lg">
                <Instagram className="text-pink-500 size-6" />
              </div>
              <h3 className="text-xl font-bold">Feed & Explorar</h3>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Destaque no Feed Principal
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Sugestões no Explorar
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Resultados de Pesquisa
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Público de Concorrentes
              </li>
            </ul>
          </div>

          {/* Reels & Stories */}
          <div className="glass-panel p-8 rounded-3xl space-y-6 relative group border-primary/10 hover:border-primary/30 transition-all duration-500">
            <div className="absolute -top-4 -right-4 bg-gradient-brand p-3 rounded-2xl shadow-glow opacity-20 group-hover:opacity-100 transition-opacity">
              <Target className="text-white size-6" />
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Sparkles className="text-blue-500 size-6" />
              </div>
              <h3 className="text-xl font-bold">Reels & Stories</h3>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Alcance Viral no Reels
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Stories para Seguidores
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Engajamento por Geolocalização
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Filtros por Interesse Real
              </li>
            </ul>
          </div>

          {/* AI Focus */}
          <div className="glass-panel p-8 rounded-3xl space-y-6 relative group border-primary/10 hover:border-primary/30 transition-all duration-500">
            <div className="absolute -top-4 -right-4 bg-gradient-brand p-3 rounded-2xl shadow-glow opacity-20 group-hover:opacity-100 transition-opacity">
              <Settings2 className="text-white size-6" />
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-lg">
                <Target className="text-green-500 size-6" />
              </div>
              <h3 className="text-xl font-bold">Foco Total</h3>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Toda a nossa tecnologia é <span className="text-foreground font-semibold">exclusiva para Instagram</span>.
              </p>
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-xs text-muted-foreground italic">
                "Identificamos o público do seu concorrente e entregamos seu perfil diretamente no celular deles."
              </div>
              <p className="text-xs text-muted-foreground">
                Crescimento rápido, seguro e sem necessidade de senhas.
              </p>
            </div>
          </div>
        </div>

        {/* AI Control Panel Visualization */}
        <div className="mt-16 glass-panel p-8 rounded-3xl border-primary/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Settings2 className="size-5 animate-spin-slow" />
                <span>Configuração Padrão Acessar I.A</span>
              </div>
              <h3 className="text-2xl font-bold">Tecnologia Inteligente para Instagram</h3>
              <p className="text-muted-foreground leading-relaxed">
                Nossa IA atua diretamente na rede da Meta para extrair o máximo de performance. Como <span className="text-foreground font-semibold underline decoration-primary/30">Meta Business Partner</span>, garantimos que seu perfil seja impulsionado seguindo todas as diretrizes oficiais, focando apenas em atrair quem realmente tem interesse no seu nicho.
              </p>
            </div>

            <div className="w-full md:w-80 bg-background/50 border border-primary/20 rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Canais Focados</span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="size-4 rounded bg-primary flex items-center justify-center">
                      <CheckCircle2 className="text-white size-3" />
                    </div>
                    <span>Feed do Instagram</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="size-4 rounded bg-primary flex items-center justify-center">
                      <CheckCircle2 className="text-white size-3" />
                    </div>
                    <span>Reels & Stories</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="size-4 rounded bg-primary flex items-center justify-center">
                      <CheckCircle2 className="text-white size-3" />
                    </div>
                    <span>Público de Concorrentes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="size-4 rounded bg-primary flex items-center justify-center">
                      <CheckCircle2 className="text-white size-3" />
                    </div>
                    <span>Geolocalização (40km)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-primary/10">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Posicionamentos</span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-primary">
                    <div className="size-4 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="size-2 rounded-full bg-primary" />
                    </div>
                    <span>Instagram Only — Recomendado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/50">
                    <div className="size-4 rounded-full border-2 border-muted-foreground/20" />
                    <span>Facebook (Desativado)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}