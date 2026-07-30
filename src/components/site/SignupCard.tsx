import { useEffect, useState, type ComponentProps, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  getAccount,
  hashPassword,
  saveAccount,
  savePlanSelection,
  type LocalAccount,
} from "@/lib/account-storage";
import { formatBRL, getPlanById } from "@/lib/plans";
import { trackPixelEvent } from "./FacebookPixel";
import { trackSiteEvent } from "@/lib/pixel.functions";

export interface SignupCardProps extends ComponentProps<"section"> {
  /** Plano escolhido na seção de planos da home. */
  selectedPlanId: string;
}

/**
 * Etapa 1 do funil (home): escolher o plano e criar a conta.
 * O restante (dados da campanha, publicações e pagamento) acontece no painel.
 */
export function SignupCard({ selectedPlanId, className, ...props }: SignupCardProps) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<LocalAccount | null>(null);

  const plan = getPlanById(selectedPlanId);

  useEffect(() => {
    setAccount(getAccount());
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (name.length < 2) return toast.error("Informe seu nome completo.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("E-mail inválido.");
    if (password.length < 6) return toast.error("A senha precisa ter ao menos 6 caracteres.");

    setSaving(true);
    try {
      const created: LocalAccount = {
        name,
        email,
        passwordHash: await hashPassword(password),
        createdAt: new Date().toISOString(),
      };
      saveAccount(created);
      savePlanSelection(selectedPlanId);
      trackPixelEvent("Lead", {
        contentName: plan?.name,
        email,
        value: plan ? plan.priceCents / 100 : undefined,
      });
      void trackSiteEvent({ data: { type: "signup" } });
      toast.success(`Conta criada! Bem-vindo(a), ${name.split(" ")[0]}.`);
      await navigate({ to: "/painel" });
    } catch {
      toast.error("Não foi possível concluir o cadastro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="pedido" className={cn("px-4 pb-24", className)} {...props}>
      <div className="glass-panel mx-auto max-w-2xl rounded-3xl p-6 md:p-10">
        <h2 className="text-2xl font-extrabold md:text-3xl">Crie sua conta para começar</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Plano selecionado:{" "}
          <strong className="text-foreground">
            {plan ? `${plan.name} — ${formatBRL(plan.priceCents)}` : "escolha um plano acima"}
          </strong>
          . Você confirma tudo no painel antes de pagar.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input id="name" name="name" defaultValue={account?.name} maxLength={120} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={account?.email}
              maxLength={160}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={saving}
            className="bg-gradient-brand shadow-glow h-12 w-full"
          >
            <UserPlus className="size-4" aria-hidden="true" />
            {saving ? "Criando conta..." : "Criar conta e ir para o painel"}
          </Button>
        </form>

        {account ? (
          <Button
            type="button"
            variant="outline"
            className="mt-4 h-11 w-full"
            onClick={() => {
              savePlanSelection(selectedPlanId);
              void navigate({ to: "/painel" });
            }}
          >
            Já tenho conta — entrar no painel
          </Button>
        ) : null}
      </div>
    </section>
  );
}
