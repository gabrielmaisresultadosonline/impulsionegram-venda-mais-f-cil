import { ArrowRight, BellRing, Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/site/PlanCard";
import { PLANS, formatBRL, type Plan } from "@/lib/plans";
import { Input } from "@/components/ui/input";

export interface PlanStepProps {
  selectedPlanId: string;
  onSelect: (planId: string) => void;
  onBack?: () => void;
  onNext?: () => void;
  /** Planos a exibir. Padrão: todos os planos. */
  plans?: readonly Plan[];
  /** Ação em andamento (geração do link de pagamento). */
  pending?: boolean;
  /** Prefixo do botão principal. */
  ctaLabel?: string;
  turbinarLink?: string;
  onTurbinarLinkChange?: (val: string) => void;
}

export function PlanStep({
  selectedPlanId,
  onSelect,
  onBack,
  onNext,
  plans = PLANS,
  pending = false,
  ctaLabel = "Comprar agora",
  turbinarLink = "",
  onTurbinarLinkChange,
}: PlanStepProps) {
  const isTurbinarPlan = selectedPlanId === "turbinar-10k";
  const isLinkValid = !isTurbinarPlan || (turbinarLink && turbinarLink.trim().length > 5);

  return (
    <div className="space-y-6">
      <header className="relative">
        <h3 className="text-xl font-bold">Escolha o melhor plano</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Selecione o plano desejado para sua campanha e turbine os resultados.
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
            enforceUnavailable
            selected={item.id === selectedPlanId && !item.unavailable}
            onSelect={item.unavailable ? undefined : onSelect}
            action={
              item.id === selectedPlanId && !item.unavailable ? (
                <div className="space-y-4">
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => {
                      if (onNext) {
                        onNext();
                      } else {
                        onSelect(item.id);
                      }
                    }}
                    disabled={pending || !isLinkValid}
                    className="h-14 w-full min-w-0 gap-2 bg-[oklch(0.62_0.18_145)] px-3 text-sm leading-tight font-bold whitespace-normal text-white shadow-lg transition-all hover:bg-[oklch(0.67_0.18_145)] disabled:opacity-50 sm:text-base"
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

                  {isTurbinarPlan && (
                    <div className="animate-in fade-in slide-in-from-top-2 space-y-2 rounded-2xl border border-dashed border-primary/40 bg-zinc-900 p-4 duration-300">
                      <label className="flex items-center gap-2 text-xs font-bold text-white uppercase text-left">
                        <LinkIcon className="size-3.5" />
                        Link do Reels Obrigatório
                      </label>
                      <Input
                        placeholder="https://www.instagram.com/reels/..."
                        value={turbinarLink}
                        onChange={(e) => onTurbinarLinkChange?.(e.target.value)}
                        className="h-10 border-primary/20 bg-background text-sm text-white focus-visible:ring-primary placeholder:text-zinc-500"
                      />
                      <p className="text-[10px] text-white/70 italic text-left">
                        Este plano exige o link do post para ser iniciado.
                      </p>
                    </div>
                  )}
                </div>
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
