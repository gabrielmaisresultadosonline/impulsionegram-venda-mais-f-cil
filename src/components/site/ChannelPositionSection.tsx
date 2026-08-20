import { CheckCircle2, Instagram, Facebook, MessageSquare, Target, Settings2 } from "lucide-react";

export function ChannelPositionSection() {
  return (
    <section className="px-4 py-20 bg-background overflow-hidden">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-extrabold md:text-4xl tracking-tight">
            Canais e <span className="text-gradient-brand">Posicionamentos</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A Acessar I.A utiliza os posicionamentos elegíveis da Meta automaticamente, priorizando as oportunidades disponíveis entre Instagram e Facebook.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Instagram */}
          <div className="glass-panel p-8 rounded-3xl space-y-6 relative group border-primary/10 hover:border-primary/30 transition-all duration-500">
            <div className="absolute -top-4 -right-4 bg-gradient-brand p-3 rounded-2xl shadow-glow opacity-20 group-hover:opacity-100 transition-opacity">
              <Instagram className="text-white size-6" />
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-pink-500/10 p-2 rounded-lg">
                <Instagram className="text-pink-500 size-6" />
              </div>
              <h3 className="text-xl font-bold">Instagram</h3>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Feed do Instagram
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Stories e Reels
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Explorar e Resultados de Pesquisa
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Perfil e outros posicionamentos Meta
              </li>
            </ul>
          </div>

          {/* Facebook */}
          <div className="glass-panel p-8 rounded-3xl space-y-6 relative group border-primary/10 hover:border-primary/30 transition-all duration-500">
            <div className="absolute -top-4 -right-4 bg-gradient-brand p-3 rounded-2xl shadow-glow opacity-20 group-hover:opacity-100 transition-opacity">
              <Facebook className="text-white size-6" />
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Facebook className="text-blue-500 size-6" />
              </div>
              <h3 className="text-xl font-bold">Facebook</h3>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Feed e Marketplace
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Stories e Reels
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Vídeos in-stream e Feed de vídeo
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-4 shrink-0" />
                Coluna direita (desktop) e Pesquisa
              </li>
            </ul>
          </div>

          {/* WhatsApp */}
          <div className="glass-panel p-8 rounded-3xl space-y-6 relative group border-primary/10 hover:border-primary/30 transition-all duration-500">
            <div className="absolute -top-4 -right-4 bg-gradient-brand p-3 rounded-2xl shadow-glow opacity-20 group-hover:opacity-100 transition-opacity">
              <MessageSquare className="text-white size-6" />
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-lg">
                <MessageSquare className="text-green-500 size-6" />
              </div>
              <h3 className="text-xl font-bold">WhatsApp</h3>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                O WhatsApp é o <span className="text-foreground font-semibold">destino principal</span> das conversões.
              </p>
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-xs text-muted-foreground italic">
                "Anúncio no Instagram/Facebook → Clique → Conversa instantânea no WhatsApp."
              </div>
              <p className="text-xs text-muted-foreground">
                Priorizamos a geração de conversas diretas para o seu negócio.
              </li>
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
              <h3 className="text-2xl font-bold">Inteligência Artificial Parceira da Meta</h3>
              <p className="text-muted-foreground leading-relaxed">
                Nossa tecnologia utiliza algoritmos avançados para identificar as melhores oportunidades em tempo real. Como <span className="text-foreground font-semibold underline decoration-primary/30">Meta Business Partner</span>, temos acesso a integrações profundas que garantem que seu anúncio apareça para quem realmente quer comprar.
              </p>
            </div>

            <div className="w-full md:w-80 bg-background/50 border border-primary/20 rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Canais de divulgação</span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="size-4 rounded bg-primary flex items-center justify-center">
                      <CheckCircle2 className="text-white size-3" />
                    </div>
                    <span>Instagram</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="size-4 rounded bg-primary flex items-center justify-center">
                      <CheckCircle2 className="text-white size-3" />
                    </div>
                    <span>Facebook</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="size-4 rounded bg-primary flex items-center justify-center">
                      <CheckCircle2 className="text-white size-3" />
                    </div>
                    <span>WhatsApp</span>
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
                    <span>Automáticos — Recomendado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/50">
                    <div className="size-4 rounded-full border-2 border-muted-foreground/20" />
                    <span>Personalizar (Manual)</span>
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
