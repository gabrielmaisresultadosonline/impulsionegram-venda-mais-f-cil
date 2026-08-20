import { ArrowDown, Check, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ORDER_BUMPS, formatBRL, sumOrderBumps, type Plan } from "@/lib/plans";

export interface OrderBumpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | undefined;
  /** Ids dos bumps marcados. */
  selectedBumps: readonly string[];
  onToggleBump: (bumpId: string) => void;
  onConfirm: () => void;
  pending?: boolean;
}

/**
 * Popup de order bump: aparece logo após o cliente escolher o plano.
 * Mostra o plano escolhido no topo e os upsells opcionais abaixo, somando
 * o total em tempo real no botão "Pagar agora".
 */
export function OrderBumpDialog({
  open,
  onOpenChange,
  plan,
  selectedBumps,
  onToggleBump,
  onConfirm,
  pending = false,
}: OrderBumpDialogProps) {
  if (!plan) return null;

  const bumpsTotal = sumOrderBumps(selectedBumps);
  const total = plan.priceCents + bumpsTotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto rounded-3xl p-0 sm:w-full">
        <div className="bg-gradient-brand text-primary-foreground rounded-t-3xl px-5 py-5 text-center sm:px-7">
          <DialogTitle className="flex items-center justify-center gap-2 text-lg font-extrabold sm:text-xl uppercase">
            <Rocket className="size-5 shrink-0" aria-hidden="true" />
            VOCÊ PODE TURBINAR SEU PLANO
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/85 mt-1 text-sm">
            Adicione extras ao seu plano e potencialize os resultados.
          </DialogDescription>
        </div>

        <div className="space-y-4 px-4 pb-5 sm:px-7">
          <div className="border-primary/40 bg-primary/5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-4">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Instagram Popularidade
              </p>
              <p className="truncate text-base font-bold">{plan.name}</p>
            </div>
            <p className="text-lg font-extrabold">{formatBRL(plan.priceCents)}</p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-bold">+ Turbine seu plano</p>
            <ArrowDown
              className="text-primary size-5 animate-bounce"
              aria-hidden="true"
            />
          </div>

          <ul className="space-y-3">
            {ORDER_BUMPS.map((bump) => {
              const checked = selectedBumps.includes(bump.id);
              return (
                <li key={bump.id}>
                  <button
                    type="button"
                    onClick={() => onToggleBump(bump.id)}
                    aria-pressed={checked}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                      checked
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border",
                        checked ? "bg-primary border-primary" : "border-muted-foreground/40",
                      )}
                      aria-hidden="true"
                    >
                      {checked ? <Check className="text-primary-foreground size-3.5" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold break-words">{bump.name}</span>
                      <span className="text-muted-foreground block text-xs break-words">
                        {bump.description}
                      </span>
                    </span>
                    <span className="text-primary shrink-0 text-sm font-extrabold">
                      + {formatBRL(bump.priceCents)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-border flex items-center justify-between gap-3 border-t pt-4">
            <span className="text-muted-foreground text-sm font-semibold">Total</span>
            <span className="text-xl font-extrabold">{formatBRL(total)}</span>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={onConfirm}
            disabled={pending}
            className="h-14 w-full gap-2 bg-[oklch(0.62_0.18_145)] text-sm leading-tight font-bold whitespace-normal text-white hover:bg-[oklch(0.67_0.18_145)] sm:text-base"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                Gerando pagamento...
              </>
            ) : (
              <span className="min-w-0">Pagar agora — {formatBRL(total)}</span>
            )}
          </Button>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground w-full text-center text-xs underline"
          >
            Voltar e escolher outro plano
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
