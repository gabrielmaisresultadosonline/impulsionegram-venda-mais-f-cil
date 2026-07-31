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
          ? "animate-plan-selected border-primary bg-gradient-to-br from-primary via-[oklch(0.63_0.21_25)] to-[oklch(0.75_0.16_75)] border-2 text-primary-foreground -translate-y-1"
          : "bg-card hover:-translate-y-1",
        className,
      )}
      {...props}
    >
      {plan.badge ? (
        <span className="bg-primary-foreground text-primary absolute -top-3 left-6 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
          {plan.badge}
        </span>
      ) : null}

      <h3 className={cn("text-lg font-bold", selected ? "text-primary-foreground" : "text-foreground")}>
        {plan.name}
      </h3>
      <p className={cn("mt-1 text-sm", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {plan.tagline}
      </p>

      <p className="mt-5 text-4xl font-extrabold">
        <span className={cn(selected ? "text-primary-foreground" : "text-gradient-brand")}>
          {formatBRL(plan.priceCents)}
        </span>
      </p>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check className={cn("mt-0.5 size-4 shrink-0", selected ? "text-primary-foreground" : "text-primary")} aria-hidden="true" />
            <span className={cn(selected ? "text-primary-foreground/95" : "text-muted-foreground")}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {onSelect ? (
        <Button
          onClick={() => onSelect(plan.id)}
          variant={ctaLabel ? "default" : selected ? "outline" : "outline"}
          className={cn(
            "mt-7 h-11 w-full font-semibold",
            selected
              ? "border-primary-foreground/50 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              : ctaLabel
                ? "bg-gradient-brand text-primary-foreground"
                : "",
          )}
        >
          {ctaLabel ?? (selected ? "Plano selecionado" : "Escolher este plano")}
        </Button>
      ) : null}
    </article>
  );
}
