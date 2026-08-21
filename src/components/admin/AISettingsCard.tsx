import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, Save, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminGetSettings } from "@/lib/admin.functions";
import { saveAISettings } from "@/lib/ai-chat.functions";

interface AdminCredentials {
  email: string;
  password: string;
}

interface AISettingsValues {
  openaiKey: string;
  aiPrompt: string;
  aiActive: boolean;
}

export function AISettingsCard({ credentials, className }: { credentials: AdminCredentials; className?: string }) {
  const getSettings = useServerFn(adminGetSettings);
  const updateSettings = useServerFn(saveAISettings);
  const queryClient = useQueryClient();

  const [openaiKey, setOpenaiKey] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiActive, setAiActive] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => getSettings({ data: credentials }),
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setOpenaiKey(settingsQuery.data.openaiKey || "");
      setAiPrompt(settingsQuery.data.aiPrompt || "");
      setAiActive(!!settingsQuery.data.aiActive);
    }
  }, [settingsQuery.data]);

  const mutation = useMutation({
    mutationFn: (values: AISettingsValues) => updateSettings({ data: { ...credentials, ...values } }),
    onSuccess: (_result, values) => {
      queryClient.setQueryData(["admin-settings"], (current: Record<string, unknown> | undefined) => ({
        ...current,
        ...values,
      }));
      toast.success("Configurações da I.A salvas!");
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao salvar."),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate({ openaiKey, aiPrompt, aiActive });
  };

  return (
    <section className={cn("glass-panel rounded-2xl p-6", className)}>
      <header className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Bot className="text-primary size-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Agente I.A (ChatGPT)</h2>
          <p className="text-muted-foreground text-sm">Configure o cérebro da assistente virtual.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="openai-key">Token OpenAI (sk-...)</Label>
          <Input
            id="openai-key"
            type="password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="Cole sua API Key aqui"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-prompt">Cérebro da I.A (Instruções de Comportamento)</Label>
          <Textarea
            id="ai-prompt"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ex: Você se chama Acessar I.A, é parceira oficial da Meta..."
            className="min-h-[120px]"
          />
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            {aiActive ? (
              <Badge className="bg-green-500/20 text-green-500 border-green-500/20">Chat Ativo</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Chat Desativado</Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const next = !aiActive;
                setAiActive(next);
                mutation.mutate({ openaiKey, aiPrompt, aiActive: next });
              }}
            >
              {aiActive ? <PowerOff className="size-4 mr-2" /> : <Power className="size-4 mr-2" />}
              {aiActive ? "Desativar" : "Ativar"}
            </Button>

            <Button
              type="submit"
              className="bg-gradient-brand shadow-glow"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 mr-2" />}
              Salvar Cérebro
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "outline";
}

function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border", className)}>
      {children}
    </span>
  );
}
