import { useCallback, useEffect, useState, type ComponentProps } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createCheckoutLink } from "@/lib/checkout.functions";
import { saveCampaignProfile } from "@/lib/profile.functions";
import { getPlanById, type Plan } from "@/lib/plans";
import { saveOrder } from "@/lib/order-storage";
import type { LocalAccount } from "@/lib/account-storage";
import { StepIndicator } from "./wizard/StepIndicator";
import { PlanStep } from "./wizard/PlanStep";
import { CampaignQuiz } from "./wizard/CampaignQuiz";
import { EMPTY_CAMPAIGN, formatRegion, type CampaignData } from "./wizard/types";

const STEPS = ["Perfil e público", "Plano e pagamento"] as const;

export interface PainelWizardProps extends ComponentProps<"section"> {
  account: LocalAccount;
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  /** Lista de planos disponíveis no funil (ex.: filtrada por origem /salaode). */
  availablePlans?: readonly Plan[];
  /** Origem do funil (home, salaode, barbea, terapi) registrada no pedido. */
  source?: string;
}

/**
 * Funil do painel do usuário cadastrado: plano → dados → pagamento.
 *
 * O link da InfinitePay abre em uma nova aba e a aba atual vai para /pedido,
 * que acompanha a confirmação em tempo real. Se o cliente fechar a aba do
 * pagamento, o webhook concilia a venda pelo nome do produto (plano + e-mail).
 */
export function PainelWizard({
  account,
  selectedPlanId,
  onSelectPlan,
  availablePlans,
  source = "home",
  className,
  ...props
}: PainelWizardProps) {
  const [step, setStep] = useState(0);
  const [campaign, setCampaign] = useState<CampaignData>({
    ...EMPTY_CAMPAIGN,
    customerName: account.name,
    customerEmail: account.email,
  });

  const plan = getPlanById(selectedPlanId);
  const createLink = useServerFn(createCheckoutLink);
  const persistProfile = useServerFn(saveCampaignProfile);

  /**
   * Salva os dados do perfil/público no cadastro antes de mostrar os planos.
   * Se a gravação falhar, seguimos assim mesmo: o cliente não pode ficar
   * travado no funil por causa do registro auxiliar.
   */
  const saveProfile = useMutation({
    mutationFn: () =>
      persistProfile({
        data: {
          name: campaign.customerName.trim(),
          email: campaign.customerEmail.trim(),
          phone: campaign.customerPhone.trim(),
          profileUrl: campaign.profileUrl.trim(),
          region: formatRegion(campaign),
          competitor: campaign.competitor.trim(),
          source,
        },
      }),
    onSettled: () => setStep(1),
  });

  useEffect(() => {
    setCampaign((current) => ({
      ...current,
      customerName: current.customerName || account.name,
      customerEmail: current.customerEmail || account.email,
    }));
  }, [account.email, account.name]);

  const patchCampaign = useCallback((patch: Partial<CampaignData>) => {
    setCampaign((current) => ({ ...current, ...patch }));
  }, []);

  const mutation = useMutation({
    mutationFn: () =>
      createLink({
        data: {
          planId: selectedPlanId,
          profileUrl: campaign.profileUrl.trim(),
          region: formatRegion(campaign),
          competitor: campaign.competitor.trim(),
          customerName: campaign.customerName.trim(),
          customerEmail: campaign.customerEmail.trim(),
          customerPhone: campaign.customerPhone.trim(),
          origin: window.location.origin,
          source,
        },
      }),
    onSuccess: (result) => {
      if (!plan) return;

      saveOrder({
        orderNsu: result.orderNsu,
        planId: plan.id,
        planName: plan.name,
        priceCents: plan.priceCents,
        customerName: campaign.customerName.trim(),
        customerEmail: campaign.customerEmail.trim(),
        customerPhone: campaign.customerPhone.trim(),
        profileUrl: campaign.profileUrl.trim(),
        region: formatRegion(campaign),
        posts: [],
        createdAt: new Date().toISOString(),
      });

      // Pagamento em nova aba; a aba atual acompanha o status em tempo real.
      window.open(result.paymentUrl, "_blank", "noopener,noreferrer");
      window.location.href = `/pedido?order_nsu=${encodeURIComponent(result.orderNsu)}`;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível iniciar o pagamento.");
    },
  });

  return (
    <section className={cn("px-4 pb-24", className)} {...props}>
      <div className="glass-panel mx-auto max-w-3xl rounded-3xl p-6 md:p-10">
        <StepIndicator steps={STEPS} current={step} />

        <div className="mt-8">
          {step === 0 ? (
            <CampaignQuiz
              data={campaign}
              onChange={patchCampaign}
              onSubmit={() => saveProfile.mutate()}
              pending={saveProfile.isPending}
            />
          ) : (
            <PlanStep
              plans={availablePlans}
              selectedPlanId={selectedPlanId}
              onSelect={onSelectPlan}
              onBack={() => setStep(0)}
              onNext={() => mutation.mutate()}
              pending={mutation.isPending}
              ctaLabel="Pagar agora —"
            />
          )}
        </div>
      </div>
    </section>
  );
}
