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
        plan.highlight && "border-primary/50",
        selected ? "shadow-glow border-primary -translate-y-1" : "hover:-translate-y-1",
        className,
      )}
      {...props}
    >
      {plan.badge ? (
        <span className="bg-gradient-brand text-primary-foreground absolute -top-3 left-6 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
          {plan.badge}
        </span>
      ) : null}

      <h3 className="text-lg font-bold">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

      <p className="mt-5 text-4xl font-extrabold">
        <span className="text-gradient-brand">{formatBRL(plan.priceCents)}</span>
      </p>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="text-muted-foreground">{feature}</span>
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
