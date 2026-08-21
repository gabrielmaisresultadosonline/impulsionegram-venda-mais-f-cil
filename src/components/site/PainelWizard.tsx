import { useCallback, useEffect, useState, type ComponentProps } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { sendWelcomeEmail } from "@/lib/email.functions";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createCheckoutLink } from "@/lib/checkout.functions";
import { saveCampaignProfile, saveCampaignProfileDraft } from "@/lib/profile.functions";
import { getPlanById, sumOrderBumps, type Plan } from "@/lib/plans";
import { saveOrder } from "@/lib/order-storage";
import type { LocalAccount } from "@/lib/account-storage";
import { StepIndicator } from "./wizard/StepIndicator";
import { PlanStep } from "./wizard/PlanStep";
import { OrderBumpDialog } from "./wizard/OrderBumpDialog";
import { CampaignQuiz } from "./wizard/CampaignQuiz";
import { EMPTY_CAMPAIGN, formatRegion, type CampaignData } from "./wizard/types";

const STEPS = ["Configurar Resultados", "Escolha o Plano", "Confirmar"] as const;

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
  const [step, setStep] = useState(0); // Começa na configuração de dados
  const [campaign, setCampaign] = useState<CampaignData>({
    ...EMPTY_CAMPAIGN,
    customerName: account.name,
    customerEmail: account.email,
    customerPhone: account.phone ?? "",
  });

  const [bumpOpen, setBumpOpen] = useState(false);
  const [selectedBumps, setSelectedBumps] = useState<string[]>([]);

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
          adLink: campaign.adLink.trim(),
          source,
        },
      }),
    onSuccess: () => setBumpOpen(true),
  });

  useEffect(() => {
    setCampaign((current) => ({
      ...current,
      customerName: current.customerName || account.name,
      customerEmail: current.customerEmail || account.email,
      customerPhone: current.customerPhone || account.phone || "",
    }));
  }, [account.email, account.name, account.phone]);

  const patchCampaign = useCallback((patch: Partial<CampaignData>) => {
    setCampaign((current) => ({ ...current, ...patch }));
  }, []);

  const mutation = useMutation({
    mutationFn: () =>
      createLink({
        data: {
          planId: selectedPlanId,
          profileUrl: campaign.profileUrl.trim() || "",
          region: formatRegion(campaign),
          competitor: campaign.competitor.trim() || "",
          customerName: campaign.customerName.trim(),
          customerEmail: campaign.customerEmail.trim(),
          customerPhone: campaign.customerPhone.trim(),
          origin: window.location.origin,
          source,
          bumpIds: selectedBumps,
          adLink: campaign.adLink.trim(),
          turbinarLink: campaign.turbinarLink?.trim() || "",
        },
      }),
    onSuccess: (result) => {
      if (!plan) return;

      saveOrder({
        orderNsu: result.orderNsu,
        planId: plan.id,
        planName: plan.name,
        priceCents: plan.priceCents + sumOrderBumps(selectedBumps),
        customerName: campaign.customerName.trim(),
        customerEmail: campaign.customerEmail.trim(),
        customerPhone: campaign.customerPhone.trim(),
        profileUrl: campaign.profileUrl.trim() || "",
        region: formatRegion(campaign),
        adLink: campaign.adLink.trim(),
        turbinarLink: campaign.turbinarLink?.trim() || "",
        posts: [],
        createdAt: new Date().toISOString(),
      });

      // O e-mail de boas-vindas já foi disparado no cadastro inicial.
      // Se fosse um novo pedido de cliente antigo, poderíamos disparar um e-mail de confirmação de pedido aqui.

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
              onSubmit={() => setStep(1)}
              askPhone={false}
              pending={saveProfile.isPending}
            />
          ) : (
            <PlanStep
              plans={availablePlans}
              selectedPlanId={selectedPlanId}
              onSelect={(planId) => {
                onSelectPlan(planId);
                // Quando seleciona um plano, já disparamos a gravação dos dados do quiz
                saveProfile.mutate();
              }}
              pending={mutation.isPending || saveProfile.isPending}
              ctaLabel="Comprar agora"
              onNext={() => setBumpOpen(true)}
              onBack={() => setStep(0)}
              turbinarLink={campaign.turbinarLink}
              onTurbinarLinkChange={(val) => patchCampaign({ turbinarLink: val })}
            />
          )}
        </div>
      </div>

      <OrderBumpDialog
        open={bumpOpen}
        onOpenChange={setBumpOpen}
        plan={plan}
        selectedBumps={selectedBumps}
        onToggleBump={(bumpId) =>
          setSelectedBumps((current) =>
            current.includes(bumpId)
              ? current.filter((id) => id !== bumpId)
              : [...current, bumpId],
          )
        }
        onConfirm={() => mutation.mutate()}
        pending={mutation.isPending}
        turbinarLink={campaign.turbinarLink}
        onTurbinarLinkChange={(val) => patchCampaign({ turbinarLink: val })}
      />
    </section>
  );
}
