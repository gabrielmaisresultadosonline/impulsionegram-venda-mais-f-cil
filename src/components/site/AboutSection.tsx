import { Bot, Sparkles, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function AboutSection() {
  return (
    <section className="py-24 px-4 overflow-hidden bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] relative border-primary/20 shadow-glow-sm">
          {/* Animated Robot/Bot Icon */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0">
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <div className="bg-gradient-brand p-5 rounded-3xl shadow-glow">
                <Bot className="size-10 text-white" />
              </div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="size-5 text-primary" />
              </motion.div>
            </motion.div>
          </div>

          <div className="mt-8 md:mt-0 md:ml-24 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                <Zap className="size-3" /> Conheça sua nova parceira
              </div>
              
              <h2 className="text-3xl md:text-5xl font-black leading-tight">
                Olá, eu sou a <span className="text-gradient-brand">Acessar I.A</span>
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Uma Inteligência Artificial <span className="text-foreground font-semibold">parceira oficial da Meta</span> desenvolvida para revolucionar o seu marketing. Eu crio e gerencio seus anúncios automaticamente via API, garantindo que sua verba seja aplicada onde realmente traz retorno.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-3xl font-black text-primary">+800</div>
                  <div className="text-sm text-muted-foreground">Empresários atendidos</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-primary">100%</div>
                  <div className="text-sm text-muted-foreground">Foco em Resultados</div>
                </div>
              </div>
            </div>

            <div className="space-y-6 bg-background/50 p-6 rounded-3xl border border-border/50">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-xl">
                  <Target className="size-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold">Resultados Inteligentes</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analiso milhares de dados em tempo real para encontrar o seu cliente ideal, filtrado por região e interesse.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-xl">
                  <Sparkles className="size-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold">Novidade no Mercado</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tecnologia de ponta que antes era acessível apenas para grandes corporações, agora disponível para o seu negócio.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground italic">
                  "Minha missão é trazer popularidade e vendas para o seu negócio sem que você precise fazer esforço."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
