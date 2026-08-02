import { ArrowRight, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/site/PlanCard";
import { PLANS, formatBRL, getPlanById, type Plan } from "@/lib/plans";

export interface PlanStepProps {
  selectedPlanId: string;
  onSelect: (planId: string) => void;
  onBack?: () => void;
  onNext: () => void;
  /** Planos a exibir. Padrão: todos os planos. */
  plans?: readonly Plan[];
  /** Ação em andamento (geração do link de pagamento). */
  pending?: boolean;
  /** Prefixo do botão principal. */
  ctaLabel?: string;
}

export function PlanStep({
  selectedPlanId,
  onSelect,
  onBack,
  onNext,
  plans = PLANS,
  pending = false,
  ctaLabel = "Continuar com",
}: PlanStepProps) {
  const plan = getPlanById(selectedPlanId);

  return (
    <div className="space-y-6">
      <header className="relative">
        <h3 className="text-xl font-bold">Escolha o melhor plano</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Você pode trocar de plano antes de finalizar o pagamento.
        </p>

        <div className="animate-pulse-glow bg-gradient-brand text-primary-foreground relative mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold shadow-lg">
          <BellRing className="size-4" aria-hidden="true" />
          Selecione o seu plano
          <span
            className="bg-primary absolute -bottom-1.5 left-6 size-3 rotate-45 rounded-[2px]"
            aria-hidden="true"
          />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((item) => (
          <PlanCard
            key={item.id}
            plan={item}
            selected={item.id === selectedPlanId}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            disabled={pending}
            className="h-12"
          >
            Voltar
          </Button>
        ) : null}
        <Button
          type="button"
          size="lg"
          onClick={onNext}
          disabled={!plan || pending}
          className="bg-gradient-brand shadow-glow h-12 flex-1"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Gerando pagamento...
            </>
          ) : (
            <>
              {ctaLabel} {plan ? `${plan.name} — ${formatBRL(plan.priceCents)}` : "um plano"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
