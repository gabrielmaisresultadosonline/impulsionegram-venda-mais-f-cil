import {
  ArrowRight,
  BadgeCheck,
  Heart,
  Instagram,
  Plus,
  Rocket,
  ShieldCheck,
  Timer,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-impulsionegram.jpg";

export interface HeroProps extends ComponentProps<"section"> {
  /** Rola até a seção de planos. */
  onCta: () => void;
}

const TRUST_ITEMS = [
  { icon: Timer, label: "Entrega em até 6h" },
  { icon: ShieldCheck, label: "Pagamento seguro" },
  { icon: Instagram, label: "Filtro por região" },
] as const;

type FloatingIcon = {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  delay: string;
  x: string;
  size: string;
  duration: string;
  color: string;
};

const FLOATING_ICONS: FloatingIcon[] = [
  { icon: Plus, delay: "0ms", x: "78%", size: "size-3", duration: "animate-float-up", color: "text-primary" },
  { icon: User, delay: "600ms", x: "85%", size: "size-4", duration: "animate-float-up-slow", color: "text-brand-3" },
  { icon: Users, delay: "1200ms", x: "92%", size: "size-3", duration: "animate-float-up", color: "text-primary" },
  { icon: Rocket, delay: "400ms", x: "74%", size: "size-3", duration: "animate-float-up-slow", color: "text-brand-2" },
  { icon: TrendingUp, delay: "900ms", x: "88%", size: "size-4", duration: "animate-float-up", color: "text-brand-3" },
  { icon: User, delay: "150ms", x: "82%", size: "size-3", duration: "animate-float-up", color: "text-primary" },
  { icon: Plus, delay: "750ms", x: "95%", size: "size-3", duration: "animate-float-up-slow", color: "text-brand-3" },
  { icon: Users, delay: "1350ms", x: "76%", size: "size-4", duration: "animate-float-up", color: "text-primary" },
  { icon: Rocket, delay: "300ms", x: "90%", size: "size-3", duration: "animate-float-up", color: "text-brand-2" },
  { icon: Heart, delay: "1000ms", x: "86%", size: "size-3", duration: "animate-float-up-slow", color: "text-primary" },
  { icon: TrendingUp, delay: "500ms", x: "80%", size: "size-4", duration: "animate-float-up", color: "text-brand-3" },
  { icon: Plus, delay: "1100ms", x: "93%", size: "size-3", duration: "animate-float-up-slow", color: "text-primary" },
];



export function Hero({ onCta, className, ...props }: HeroProps) {
  return (
    <section
      className={cn("relative overflow-hidden bg-aurora px-4 pt-14 pb-20 md:pt-20", className)}
      {...props}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <Instagram className="size-3.5" aria-hidden="true" />
              POPULAR
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              Parceiro oficial da Meta
            </span>
          </div>

          <div className="relative mt-6">
            <div className="relative">
              <h1 className="text-3xl leading-[1.08] font-extrabold text-balance md:text-5xl">
                Mais Engajamento, mais clientes, mais público filtrado por região e CEP no automático.
              </h1>

              {/* Efeito de ícones flutuando ao lado do título */}
              <div
                className="pointer-events-none absolute top-0 right-0 left-0 h-28"
                aria-hidden="true"
              >
                {FLOATING_ICONS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <span
                      key={`${index}`}
                      className={cn(
                        "absolute bottom-0 inline-block opacity-0",
                        item.duration,
                        item.color
                      )}
                      style={{
                        left: item.x,
                        animationDelay: item.delay,
                      }}
                    >
                      <Icon className={item.size} aria-hidden={true} />
                    </span>
                  );
                })}
              </div>
            </div>

            <p className="mt-4 text-lg leading-snug font-semibold text-balance text-foreground md:text-xl">
              Basta uma configuração. Faça tudo direto pelo seu celular.
            </p>
          </div>

          <p className="mt-6 max-w-xl text-base text-pretty text-muted-foreground md:text-lg">
            Ganhe seguidores filtrados por cidade, região e comportamento do seu concorrente — sem
            esforço manual. Escolha o plano, envie as publicações, pague e acompanhe tudo no seu
            painel.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={onCta} className="bg-gradient-brand shadow-glow h-12 px-7">
              Ver planos e impulsionar
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button size="lg" variant="outline" onClick={onCta} className="h-12 px-7">
              Como funciona
            </Button>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="text-primary size-4" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="bg-gradient-brand absolute -inset-6 rounded-[2.5rem] opacity-20 blur-3xl" />
          <img
            src={heroImage}
            alt="Celular exibindo um perfil do Instagram com crescimento de seguidores"
            width={1200}
            height={1200}
            className="shadow-card relative rounded-[2rem] border border-border"
          />
        </div>
      </div>
    </section>
  );
}
