import { ArrowRight, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/site/PlanCard";
import { PLANS, formatBRL, type Plan } from "@/lib/plans";

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
            action={
              item.id === selectedPlanId ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={onNext}
                  disabled={pending}
                  className="h-14 w-full min-w-0 gap-2 bg-[oklch(0.85_0.17_85)] px-3 text-sm leading-tight font-bold whitespace-normal text-[oklch(0.25_0.05_60)] shadow-lg hover:bg-[oklch(0.88_0.17_85)] sm:text-base"
                >
                  {pending ? (
                    <>
                      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                      Gerando pagamento...
                    </>
                  ) : (
                    <>
                      <span className="min-w-0">
                        {ctaLabel} {item.name} — {formatBRL(item.priceCents)}
                      </span>
                      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                    </>
                  )}
                </Button>
              ) : null
            }
          />
        ))}
      </div>

      {onBack ? (
        <div className="flex">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            disabled={pending}
            className="h-12 w-full sm:w-auto"
          >
            Voltar
          </Button>
        </div>
      ) : null}
    </div>
  );
}

