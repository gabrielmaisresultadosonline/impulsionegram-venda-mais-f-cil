import { ArrowRight, BadgeCheck, Instagram, ShieldCheck, Timer } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Social3DIcons } from "@/components/site/Social3DIcons";

export interface HeroProps extends ComponentProps<"section"> {
  /** Abre o popup de cadastro. */
  onCta: () => void;
  /** Rola até a seção de planos. */
  onSecondary?: () => void;
}

const TRUST_ITEMS = [
  { icon: Timer, label: "Entrega em até 6h" },
  { icon: ShieldCheck, label: "Pagamento seguro" },
  { icon: Instagram, label: "Filtro por região" },
] as const;

export function Hero({ onCta, onSecondary, className, ...props }: HeroProps) {
  return (
    <section
      className={cn("relative overflow-hidden bg-aurora px-4 pt-14 pb-20 md:pt-20", className)}
      {...props}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <Instagram className="size-3.5 text-primary" aria-hidden="true" />
            POPULAR
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Parceiro oficial da Meta
          </span>
        </div>

        <Social3DIcons className="mt-10 md:mt-12" />

        <h1 className="mt-8 text-4xl leading-[1.1] font-extrabold tracking-tight text-balance md:text-6xl">
          Mais engajamento,
          <br />
          mais clientes.
        </h1>

        <p className="mt-4 max-w-2xl text-xl leading-snug font-semibold text-balance text-muted-foreground md:text-2xl">
          Público filtrado por região e CEP{" "}
          <span className="text-gradient-brand">no automático.</span>
        </p>

        <p className="mt-6 max-w-2xl text-base text-pretty text-muted-foreground md:text-lg">
          Basta uma configuração e você faz tudo direto pelo celular. Ganhe seguidores filtrados por
          cidade, região e pelo perfil do seu concorrente — sem esforço manual.
        </p>

        <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Button size="lg" onClick={onCta} className="bg-gradient-brand shadow-glow h-12 px-7">
            Cadastre-se grátis
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
          <Button size="lg" variant="outline" onClick={onSecondary ?? onCta} className="h-12 px-7">
            Ver planos
          </Button>
        </div>

        <ul className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-3">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="text-primary size-4" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
