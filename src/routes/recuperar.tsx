import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { hashPassword, saveAccount, getAccount } from "@/lib/account-storage";

const searchSchema = z.object({
  email: z.string().email().optional(),
});

export const Route = createFileRoute("/recuperar")({
  validateSearch: (search) => searchSchema.parse(search),
  component: RecoveryPage,
});

function RecoveryPage() {
  const { email } = useSearch({ from: "/recuperar" });
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!email) {
      void navigate({ to: "/" });
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres.");
    if (password !== confirmPassword) return toast.error("As senhas não coincidem.");

    setSaving(true);
    try {
      // Como o sistema é simulado localmente, atualizamos o armazenamento local
      // se o e-mail coincidir com o cadastro existente no navegador.
      const stored = getAccount();
      const newHash = await hashPassword(password);
      
      if (stored && stored.email.toLowerCase() === email?.toLowerCase()) {
        saveAccount({
          ...stored,
          passwordHash: newHash,
        });
        toast.success("Senha redefinida com sucesso!");
        void navigate({ to: "/" });
      } else {
        // Se não houver cadastro local ou for outro e-mail, criamos um registro local "base"
        // para permitir o acesso (simulando que a recuperação deu certo via e-mail).
        saveAccount({
          name: email?.split("@")[0] || "Usuário",
          email: email!,
          passwordHash: newHash,
          createdAt: new Date().toISOString(),
        });
        toast.success("Senha redefinida e conta sincronizada localmente!");
        void navigate({ to: "/painel" });
      }
    } catch (err) {
      toast.error("Erro ao redefinir senha.");
    } finally {
      setSaving(false);
    }
  };

  if (!email) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md border-primary/20 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
          <CardDescription>
            Defina uma nova senha para o acesso: <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-brand shadow-glow"
              disabled={saving}
            >
              {saving ? "Salvando..." : "Atualizar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
