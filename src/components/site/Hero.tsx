import { ArrowRight, Instagram, ShieldCheck, Timer } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/logo.png.asset.json";



export interface HeroProps extends ComponentProps<"section"> {
  /** Abre o popup de cadastro. */
  onCta: () => void;
  /** Rola até a seção de planos. */
  onSecondary?: () => void;
  /** Linhas do título principal (padrão: home). */
  headline?: readonly string[];
  /** Subtítulo em destaque. */
  highlight?: string;
  /** Descrição abaixo do subtítulo. */
  description?: string;
  /** Rótulo do botão primário. */
  ctaLabel?: string;
  /** Rótulo do botão secundário. */
  secondaryLabel?: string;
}

const TRUST_ITEMS = [
  { icon: Timer, label: "Entrega em até 6h" },
  { icon: ShieldCheck, label: "Pagamento seguro" },
  { icon: Instagram, label: "Filtro por região" },
] as const;

const DEFAULT_TITLE = ["MAIS VENDAS,", "MAIS CLIENTES, MAIS", "ENGAJAMENTO NO AUTOMÁTICO !"] as const;
const DEFAULT_HIGHLIGHT = "Seguidores, alcance e visualizações: resultados automáticos.";
const DEFAULT_DESCRIPTION =
  "Basta uma configuração e nossa I.A faz tudo para você. Ganhe seguidores filtrados por cidade, região e pelo perfil do seu concorrente no Instagram.";

export function Hero({
  onCta,
  onSecondary,
  headline,
  highlight,
  description,
  ctaLabel,
  secondaryLabel,
  className,
  ...props
}: HeroProps) {
  const titleLines = headline ?? DEFAULT_TITLE;
  const highlightText = highlight ?? DEFAULT_HIGHLIGHT;
  const descriptionText = description ?? DEFAULT_DESCRIPTION;
  const primaryCta = ctaLabel ?? "Cadastre-se grátis";
  const secondaryCta = secondaryLabel ?? "Ver planos";

  return (
    <section
      className={cn("relative overflow-hidden bg-aurora px-4 pt-6 pb-16 md:pt-20", className)}
      {...props}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <button 
          onClick={onCta}
          className="absolute top-4 right-4 z-50 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-md px-6 py-2 rounded-full md:top-6 md:right-6"
        >
          Sou Membro
        </button>
        <img 
          src="https://5306062e-dd22-4505-a2c3-baf689a08983.lovableproject.com/__l5e/assets-v1/3b3c5073-9d32-4c16-b79c-1bd3a4b9b8df/logo-acessar-click.png" 
          alt="Acessar Click Logo" 
          className="w-full max-w-[220px] md:max-w-[280px] h-auto object-contain mt-4 md:mt-6 animate-float"
        />

        <h1 className="mt-3 text-[8.5vw] leading-[1.05] font-black tracking-tighter text-balance md:mt-8 md:text-5xl lg:text-6xl uppercase">
          {titleLines.map((line) => (
            <span key={line} className="block w-full break-words">
              {line}
            </span>
          ))}
        </h1>

        <p className="mt-4 max-w-2xl text-xl leading-snug font-semibold text-balance text-muted-foreground md:text-2xl">
          {highlightText.split(" ").slice(0, -1).join(" ")}{" "}
          <span className="text-gradient-brand">
            {highlightText.split(" ").pop()}
          </span>
        </p>

        <p className="mt-6 max-w-2xl text-base text-pretty text-muted-foreground md:text-lg">
          {descriptionText}
        </p>

        <div className="mt-9 flex w-full flex-col items-center justify-center gap-8">
          
          <div className="flex flex-col items-center gap-3">
            <img 
              src="/meta-partner.png" 
              alt="Meta Business Partner" 
              className="h-8 w-auto object-contain opacity-90"
            />
            <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Button size="lg" onClick={onCta} className="bg-gradient-brand shadow-glow h-12 px-7">
                {primaryCta}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button size="lg" variant="outline" onClick={onSecondary ?? onCta} className="h-12 px-7">
                {secondaryCta}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
