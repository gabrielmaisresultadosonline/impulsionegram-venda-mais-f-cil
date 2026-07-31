import { Check } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatBRL, type Plan } from "@/lib/plans";

export interface PlanCardProps extends Omit<ComponentProps<"article">, "onSelect"> {
  plan: Plan;
  selected?: boolean;
  onSelect?: (planId: string) => void;
  /** Rótulo customizado do botão (ex.: "Cadastre-se grátis" na home). */
  ctaLabel?: string;
}

export function PlanCard({
  plan,
  selected,
  onSelect,
  ctaLabel,
  className,
  ...props
}: PlanCardProps) {
  return (
    <article
      className={cn(
        "glass-panel relative flex flex-col rounded-2xl p-6 transition-all duration-300",
        plan.highlight && !selected && "border-primary/50",
        selected
          ? "shadow-glow animate-pulse-glow border-2 border-primary bg-gradient-to-br from-primary/25 via-primary/15 to-transparent -translate-y-1"
          : "bg-card hover:-translate-y-1",
        className,
      )}
      {...props}
    >
      {plan.badge ? (
        <span className="bg-gradient-brand text-primary-foreground absolute -top-3 left-6 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
          {plan.badge}
        </span>
      ) : null}

      <h3 className={cn("text-lg font-bold", selected ? "text-foreground" : "text-foreground")}>
        {plan.name}
      </h3>
      <p className={cn("mt-1 text-sm", selected ? "text-foreground/80" : "text-muted-foreground")}>
        {plan.tagline}
      </p>

      <p className="mt-5 text-4xl font-extrabold">
        <span className="text-gradient-brand">{formatBRL(plan.priceCents)}</span>
      </p>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check
              className={cn("mt-0.5 size-4 shrink-0", selected ? "text-primary" : "text-primary")}
              aria-hidden="true"
            />
            <span className={cn(selected ? "text-foreground/90" : "text-muted-foreground")}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {onSelect ? (
        <Button
          onClick={() => onSelect(plan.id)}
          variant={ctaLabel ? "default" : selected ? "default" : "outline"}
          className={cn("mt-7 h-11 w-full", (ctaLabel || selected) && "bg-gradient-brand")}
        >
          {ctaLabel ?? (selected ? "Plano selecionado" : "Escolher este plano")}
        </Button>
      ) : null}
    </article>
  );
}
