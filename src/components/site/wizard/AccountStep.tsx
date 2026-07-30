import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hashPassword, saveAccount, type LocalAccount } from "@/lib/account-storage";

export interface AccountStepProps {
  account: LocalAccount | null;
  onDone: (account: LocalAccount) => void;
}

export function AccountStep({ account, onDone }: AccountStepProps) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (name.length < 2) return toast.error("Informe seu nome completo.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("E-mail inválido.");
    if (password.length < 6) return toast.error("A senha precisa ter ao menos 6 caracteres.");
    if (password !== confirm) return toast.error("As senhas não conferem.");

    setSaving(true);
    try {
      const created: LocalAccount = {
        name,
        email,
        passwordHash: await hashPassword(password),
        createdAt: new Date().toISOString(),
      };
      saveAccount(created);
      toast.success("Cadastro criado! Agora escolha seu plano.");
      onDone(created);
    } catch {
      toast.error("Não foi possível concluir o cadastro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <header>
        <h3 className="text-xl font-bold">Crie sua conta</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          É rápido: com a conta você acompanha o pedido e a entrega no seu painel.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
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
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar senha *</Label>
          <Input id="confirm" name="confirm" type="password" minLength={6} required />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={saving}
        className="bg-gradient-brand shadow-glow h-12 w-full"
      >
        <UserPlus className="size-4" aria-hidden="true" />
        {saving ? "Criando conta..." : "Criar conta e escolher plano"}
      </Button>
    </form>
  );
}
