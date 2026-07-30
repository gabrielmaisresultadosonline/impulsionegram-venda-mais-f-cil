import { ArrowRight, Instagram, ShieldCheck, Timer } from "lucide-react";
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

export function Hero({ onCta, className, ...props }: HeroProps) {
  return (
    <section
      className={cn("relative overflow-hidden bg-aurora px-4 pt-14 pb-20 md:pt-20", className)}
      {...props}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <Instagram className="size-3.5" aria-hidden="true" />
            Impulsionegram
          </span>

          <h1 className="mt-6 text-4xl leading-[1.05] font-extrabold text-balance md:text-6xl">
            Nunca foi tão fácil <span className="text-gradient-brand">vender mais</span> sem
            precisar de muito esforço
          </h1>

          <p className="mt-6 max-w-xl text-base text-pretty text-muted-foreground md:text-lg">
            Ganhe popularidade para o seu negócio com seguidores filtrados por região e filtrados
            direto do perfil do seu concorrente. Você escolhe o plano, envia até 5 publicações,
            paga e acompanha tudo no seu painel.
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
