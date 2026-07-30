import { useCallback, useEffect, useState, type ComponentProps } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createCheckoutLink } from "@/lib/checkout.functions";
import { getPlanById } from "@/lib/plans";
import { saveOrder } from "@/lib/order-storage";
import type { LocalAccount } from "@/lib/account-storage";
import { StepIndicator } from "./wizard/StepIndicator";
import { PlanStep } from "./wizard/PlanStep";
import { CampaignStep } from "./wizard/CampaignStep";
import { PostsStep } from "./wizard/PostsStep";
import { EMPTY_CAMPAIGN, MAX_POSTS, formatRegion, type CampaignData } from "./wizard/types";

const STEPS = ["Plano", "Dados", "Publicações"] as const;

export interface PainelWizardProps extends ComponentProps<"section"> {
  account: LocalAccount;
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
}

/**
 * Funil do painel do usuário cadastrado: plano → dados → publicações → pagamento.
 * O pagamento é gerado na InfinitePay e confirmado em tempo real em /pedido.
 */
export function PainelWizard({
  account,
  selectedPlanId,
  onSelectPlan,
  className,
  ...props
}: PainelWizardProps) {
  const [step, setStep] = useState(0);
  const [campaign, setCampaign] = useState<CampaignData>({
    ...EMPTY_CAMPAIGN,
    customerName: account.name,
    customerEmail: account.email,
  });
  const [posts, setPosts] = useState<string[]>(Array.from({ length: MAX_POSTS }, () => ""));

  const plan = getPlanById(selectedPlanId);
  const createLink = useServerFn(createCheckoutLink);

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
    mutationFn: () => {
      const cleanPosts = posts.map((post) => post.trim()).filter(Boolean);
      return createLink({
        data: {
          planId: selectedPlanId,
          profileUrl: campaign.profileUrl.trim(),
          region: formatRegion(campaign),
          competitor: campaign.competitor.trim(),
          posts: cleanPosts,
          customerName: campaign.customerName.trim(),
          customerEmail: campaign.customerEmail.trim(),
          customerPhone: campaign.customerPhone.trim(),
          origin: window.location.origin,
        },
      });
    },
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
        posts: posts.map((post) => post.trim()).filter(Boolean),
        createdAt: new Date().toISOString(),
      });

      window.location.href = result.paymentUrl;
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
            <PlanStep
              selectedPlanId={selectedPlanId}
              onSelect={onSelectPlan}
              onBack={() => setStep(0)}
              onNext={() => setStep(1)}
            />
          ) : null}

          {step === 1 ? (
            <CampaignStep
              data={campaign}
              onChange={patchCampaign}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          ) : null}

          {step === 2 ? (
            <PostsStep
              posts={posts}
              onChange={(index, value) =>
                setPosts((current) => current.map((item, i) => (i === index ? value : item)))
              }
              plan={plan}
              pending={mutation.isPending}
              onBack={() => setStep(1)}
              onSubmit={() => mutation.mutate()}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
