import { useState, type ComponentProps, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCheckoutLink } from "@/lib/checkout.functions";
import { formatBRL, getPlanById } from "@/lib/plans";
import { saveOrder } from "@/lib/order-storage";

export interface OrderFormProps extends ComponentProps<"section"> {
  selectedPlanId: string;
}

const POST_SLOTS = [0, 1, 2, 3, 4] as const;

export function OrderForm({ selectedPlanId, className, ...props }: OrderFormProps) {
  const [posts, setPosts] = useState<string[]>(["", "", "", "", ""]);
  const plan = getPlanById(selectedPlanId);
  const createLink = useServerFn(createCheckoutLink);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      const value = (key: string) => String(formData.get(key) ?? "").trim();
      return createLink({
        data: {
          planId: selectedPlanId,
          profileUrl: value("profileUrl"),
          region: value("region"),
          competitor: value("competitor"),
          posts: posts.map((post) => post.trim()).filter(Boolean),
          customerName: value("customerName"),
          customerEmail: value("customerEmail"),
          customerPhone: value("customerPhone"),
          origin: window.location.origin,
        },
      });
    },
    onSuccess: (result, formData) => {
      if (!plan) return;
      saveOrder({
        orderNsu: result.orderNsu,
        planId: plan.id,
        planName: plan.name,
        priceCents: plan.priceCents,
        profileUrl: String(formData.get("profileUrl") ?? ""),
        region: String(formData.get("region") ?? ""),
        posts: posts.map((post) => post.trim()).filter(Boolean),
        createdAt: new Date().toISOString(),
      });
      window.location.href = result.paymentUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível iniciar o pagamento.");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plan) {
      toast.error("Selecione um plano antes de continuar.");
      return;
    }
    mutation.mutate(new FormData(event.currentTarget));
  };

  return (
    <section id="pedido" className={cn("px-4 pb-24", className)} {...props}>
      <div className="glass-panel mx-auto max-w-3xl rounded-3xl p-6 md:p-10">
        <h2 className="text-2xl font-extrabold md:text-3xl">Finalize seu pedido</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Plano selecionado:{" "}
          <strong className="text-foreground">{plan ? plan.name : "nenhum"}</strong>
          {plan ? ` — ${formatBRL(plan.priceCents)}` : ""}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="profileUrl" label="Link do seu perfil *" placeholder="instagram.com/seu.perfil" required />
            <Field id="region" label="Região / cidade dos seguidores *" placeholder="Ex.: Porto Velho - RO" required />
            <Field id="competitor" label="Perfil do concorrente (opcional)" placeholder="instagram.com/concorrente" />
            <Field id="customerName" label="Seu nome *" placeholder="Nome completo" required />
            <Field id="customerEmail" label="E-mail *" type="email" placeholder="voce@email.com" required />
            <Field id="customerPhone" label="WhatsApp (opcional)" placeholder="+55 69 99999-9999" />
          </div>

          <fieldset className="space-y-3 rounded-2xl border border-border p-5">
            <legend className="px-2 text-sm font-semibold">
              Até 5 publicações (fotos ou reels)
            </legend>
            {POST_SLOTS.map((index) => (
              <Input
                key={`post-${index}`}
                value={posts[index]}
                onChange={(event) =>
                  setPosts((current) =>
                    current.map((item, i) => (i === index ? event.target.value : item)),
                  )
                }
                placeholder={`Link da publicação ${index + 1}`}
                aria-label={`Link da publicação ${index + 1}`}
                maxLength={300}
              />
            ))}
          </fieldset>

          <Button
            type="submit"
            size="lg"
            disabled={mutation.isPending || !plan}
            className="bg-gradient-brand shadow-glow h-12 w-full"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Lock className="size-4" aria-hidden="true" />
            )}
            {mutation.isPending
              ? "Gerando pagamento..."
              : `Salvar e pagar ${plan ? formatBRL(plan.priceCents) : ""}`}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Pagamento processado pela InfinitePay (Pix ou cartão). A confirmação aparece
            automaticamente no seu painel.
          </p>
        </form>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  ...inputProps
}: ComponentProps<typeof Input> & { id: string; label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} maxLength={200} {...inputProps} />
    </div>
  );
}
