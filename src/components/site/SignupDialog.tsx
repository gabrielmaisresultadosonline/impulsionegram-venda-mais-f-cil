import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export interface SignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Plano pré-selecionado (opcional). O cliente pode escolher depois no painel. */
  selectedPlanId?: string;
  /** Para onde redirecionar após cadastro/login. Padrão: /painel */
  redirectTo?: string;
}

type DialogMode = "signup" | "login";

/**
 * Popup de cadastro/login acionado pelos CTAs "Cadastre-se grátis" da home.
 * Mantém o mesmo contrato do fluxo antigo: cria a conta local e leva ao painel.
 */
export function SignupDialog({ open, onOpenChange, selectedPlanId }: SignupDialogProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<DialogMode>("signup");
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<LocalAccount | null>(null);

  const plan = selectedPlanId ? getPlanById(selectedPlanId) : undefined;

  useEffect(() => {
    if (open) {
      setAccount(getAccount());
      setMode("signup");
    }
  }, [open]);

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
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
      if (selectedPlanId) savePlanSelection(selectedPlanId);
      trackPixelEvent("Lead", {
        contentName: plan?.name,
        email,
        value: plan ? plan.priceCents / 100 : undefined,
      });
      void trackSiteEvent({ data: { type: "signup", name, email } });
      toast.success(`Conta criada! Bem-vindo(a), ${name.split(" ")[0]}.`);
      onOpenChange(false);
      await navigate({ to: "/painel" });
    } catch {
      toast.error("Não foi possível concluir o cadastro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("E-mail inválido.");
    if (password.length < 6) return toast.error("A senha precisa ter ao menos 6 caracteres.");

    setSaving(true);
    try {
      const stored = getAccount();
      if (!stored) {
        return toast.error("Nenhuma conta encontrada neste dispositivo. Crie uma conta primeiro.");
      }
      if (stored.email.toLowerCase() !== email.toLowerCase()) {
        return toast.error("E-mail não encontrado.");
      }
      const passwordHash = await hashPassword(password);
      if (passwordHash !== stored.passwordHash) {
        return toast.error("Senha incorreta.");
      }
      if (selectedPlanId) savePlanSelection(selectedPlanId);
      toast.success(`Bem-vindo(a) de volta, ${stored.name.split(" ")[0]}!`);
      onOpenChange(false);
      await navigate({ to: "/painel" });
    } catch {
      toast.error("Não foi possível entrar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">
            {mode === "signup" ? "Cadastre-se grátis" : "Entrar na conta"}
          </DialogTitle>
          <DialogDescription>
            {mode === "signup"
              ? plan
                ? `Plano em destaque: ${plan.name} — ${formatBRL(plan.priceCents)}. Você confirma tudo no painel antes de pagar.`
                : "Crie sua conta em segundos. Você escolhe o plano e confirma tudo no painel antes de pagar."
              : "Acesse seu painel para escolher planos, acompanhar pedidos e configurar campanhas."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === "signup"
                ? "bg-gradient-brand text-white shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Criar conta
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === "login"
                ? "bg-gradient-brand text-white shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Entrar
          </button>
        </div>

        {mode === "signup" ? (
          <form onSubmit={handleSignup} className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Nome completo *</Label>
              <Input
                id="signup-name"
                name="name"
                defaultValue={account?.name}
                maxLength={120}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">E-mail *</Label>
              <Input
                id="signup-email"
                name="email"
                type="email"
                defaultValue={account?.email}
                maxLength={160}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Senha *</Label>
              <Input id="signup-password" name="password" type="password" minLength={6} required />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={saving}
              className="bg-gradient-brand shadow-glow h-12 w-full"
            >
              <UserPlus className="size-4" aria-hidden="true" />
              {saving ? "Criando conta..." : "Criar conta grátis"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">E-mail *</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                defaultValue={account?.email}
                maxLength={160}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Senha *</Label>
              <Input id="login-password" name="password" type="password" minLength={6} required />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={saving}
              className="bg-gradient-brand shadow-glow h-12 w-full"
            >
              <LogIn className="size-4" aria-hidden="true" />
              {saving ? "Entrando..." : "Entrar no painel"}
            </Button>
          </form>
        )}

        {account ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            onClick={() => {
              if (selectedPlanId) savePlanSelection(selectedPlanId);
              onOpenChange(false);
              void navigate({ to: "/painel" });
            }}
          >
            Já tenho conta — entrar no painel
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

