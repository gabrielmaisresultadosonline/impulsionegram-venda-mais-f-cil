import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/site/PlanCard";
import { PLANS, formatBRL, getPlanById } from "@/lib/plans";

export interface PlanStepProps {
  selectedPlanId: string;
  onSelect: (planId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function PlanStep({ selectedPlanId, onSelect, onBack, onNext }: PlanStepProps) {
  const plan = getPlanById(selectedPlanId);

  return (
    <div className="space-y-6">
      <header>
        <h3 className="text-xl font-bold">Escolha o melhor plano</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Você pode trocar de plano antes de finalizar o pagamento.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((item) => (
          <PlanCard
            key={item.id}
            plan={item}
            selected={item.id === selectedPlanId}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="outline" size="lg" onClick={onBack} className="h-12">
          Voltar
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onNext}
          disabled={!plan}
          className="bg-gradient-brand shadow-glow h-12 flex-1"
        >
          Continuar com {plan ? `${plan.name} — ${formatBRL(plan.priceCents)}` : "um plano"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
