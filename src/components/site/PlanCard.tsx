import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatBRL, type Plan } from "@/lib/plans";

export interface PlanCardProps extends Omit<ComponentProps<"article">, "onSelect"> {
  plan: Plan;
  selected?: boolean;
  onSelect?: (planId: string) => void;
  /** Rótulo customizado do botão (ex.: "Cadastre-se grátis" na home). */
  ctaLabel?: string;
  /**
   * Ação exibida dentro do card logo abaixo do botão de seleção — usada no
   * funil para o "Pagar agora" aparecer no plano escolhido, sem o cliente
   * precisar rolar até o fim da página.
   */
  action?: ReactNode;
}

export function PlanCard({
  plan,
  selected,
  onSelect,
  ctaLabel,
  action,
  className,
  ...props
}: PlanCardProps) {
  // Plano bloqueado: nunca pode ficar "selecionado" nem disparar onSelect.
  const blocked = plan.unavailable === true;
  const isSelected = selected === true && !blocked;

  return (
    <article
      aria-disabled={blocked || undefined}
      className={cn(
        "glass-panel relative flex flex-col rounded-2xl p-6 transition-all duration-300",
        plan.highlight && !isSelected && !blocked && "border-primary/50",
        blocked
          ? "border-muted bg-muted/40 opacity-70 grayscale"
          : isSelected
            ? "animate-plan-selected border-primary bg-gradient-to-br from-primary via-[oklch(0.63_0.21_25)] to-[oklch(0.75_0.16_75)] border-2 text-primary-foreground -translate-y-1"
            : "bg-card hover:-translate-y-1",
        className,
      )}
      {...props}
    >
      {plan.badge ? (
        <span
          className={cn(
            "absolute -top-3 left-6 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase",
            blocked ? "bg-muted-foreground text-background" : "bg-primary-foreground text-primary",
          )}
        >
          {plan.badge}
        </span>
      ) : null}

      <h3
        className={cn(
          "text-lg font-bold",
          blocked ? "text-muted-foreground" : isSelected ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {plan.name}
      </h3>
      <p className={cn("mt-1 text-sm", isSelected && !blocked ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {plan.tagline}
      </p>

      <p className="mt-5 text-4xl font-extrabold">
        <span className={cn(blocked ? "text-muted-foreground" : isSelected ? "text-primary-foreground" : "text-gradient-brand")}>
          {formatBRL(plan.priceCents)}
        </span>
      </p>

      {blocked ? (
        <p className="text-muted-foreground mt-3 text-xs font-semibold">
          Indisponível no momento, devido à alta demanda.
        </p>
      ) : null}

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check
              className={cn(
                "mt-0.5 size-4 shrink-0",
                blocked ? "text-muted-foreground" : isSelected ? "text-primary-foreground" : "text-primary",
              )}
              aria-hidden="true"
            />
            <span className={cn(isSelected && !blocked ? "text-primary-foreground/95" : "text-muted-foreground")}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {blocked ? (
        <Button
          type="button"
          disabled
          variant="outline"
          className="text-muted-foreground border-muted bg-muted/60 mt-7 h-11 w-full font-semibold"
        >
          Indisponível
        </Button>
      ) : onSelect ? (
        <Button
          onClick={() => onSelect(plan.id)}
          variant="outline"
          className={cn(
            "mt-7 h-11 w-full font-semibold",
            isSelected
              ? "border-primary-foreground/50 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              : ctaLabel
                ? "bg-gradient-brand text-primary-foreground"
                : "",
          )}
        >
          {ctaLabel ?? (isSelected ? "Plano selecionado" : "Escolher este plano")}
        </Button>
      ) : null}

      {!blocked && action ? <div className="mt-3">{action}</div> : null}
    </article>
  );
}
