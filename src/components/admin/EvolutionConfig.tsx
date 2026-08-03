import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  QrCode, 
  Settings2, 
  Bot, 
  Save, 
  Loader2, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminCredentials } from "@/routes/admin";
import {
  adminGetEvolutionConfig,
  adminSaveEvolutionConfig,
  adminGetEvolutionQrCode,
  adminInstallEvolutionLocal,
} from "@/lib/evolution.functions";

interface EvolutionConfigProps {
  credentials: AdminCredentials;
  className?: string;
}

export function EvolutionConfig({ credentials, className }: EvolutionConfigProps) {
  const queryClient = useQueryClient();
  const getBotConfig = useServerFn(adminGetEvolutionConfig);
  const saveBotConfig = useServerFn(adminSaveEvolutionConfig);
  const getQrCode = useServerFn(adminGetEvolutionQrCode);
  const installLocal = useServerFn(adminInstallEvolutionLocal);
  const [installing, setInstalling] = useState(false);

  const [form, setForm] = useState({
    apiUrl: "",
    apiKey: "",
    instanceName: "",
    openaiKey: "",
    aiPrompt: "",
    aiActive: false,
  });

  const configQuery = useQuery({
    queryKey: ["evolution-config"],
    queryFn: async () => {
      const data = await getBotConfig({ data: credentials });
      setForm(data);
      return data;
    },
  });

  const qrQuery = useQuery({
    queryKey: ["evolution-qr"],
    queryFn: () => getQrCode({ data: credentials }),
    enabled: !!form.apiUrl && !!form.apiKey && !!form.instanceName,
    refetchInterval: (query) => (query.state.data?.base64 ? false : 15000),
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => saveBotConfig({ data: { ...data, ...credentials } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evolution-config"] });
      toast.success("Configurações do WhatsApp salvas!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao salvar."),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const handleInstallLocal = async () => {
    try {
      setInstalling(true);
      await installLocal({ data: credentials });
      queryClient.invalidateQueries({ queryKey: ["evolution-config"] });
      toast.success("Instalação automática configurada!");
    } catch (err: any) {
      toast.error(err.message || "Erro na instalação.");
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className={className}>
      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" />
            <h2 className="text-lg font-bold">Conexão WhatsApp (Evolution API)</h2>
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Conecte sua instância para disparos automáticos e atendimento com IA.
          </p>
        </div>

        <Tabs defaultValue="config" className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2 lg:w-72">
              <TabsTrigger value="config" className="gap-2">
                <Settings2 className="size-4" /> Configurar
              </TabsTrigger>
              <TabsTrigger value="connect" className="gap-2">
                <QrCode className="size-4" /> Conectar
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="config" className="p-6 focus-visible:outline-none">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">URL da Evolution API</Label>
                  <Input
                    id="apiUrl"
                    placeholder="https://sua-api.com"
                    value={form.apiUrl}
                    onChange={(e) => setForm((f) => ({ ...f, apiUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instanceName">Nome da Instância</Label>
                  <Input
                    id="instanceName"
                    placeholder="PopularBot"
                    value={form.instanceName}
                    onChange={(e) => setForm((f) => ({ ...f, instanceName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="apiKey">API Key (Global ou da Instância)</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Seu token de acesso"
                    value={form.apiKey}
                    onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="size-5 text-primary" />
                    <Label htmlFor="aiActive" className="font-bold">Agente de IA (ChatGPT)</Label>
                  </div>
                  <Switch
                    id="aiActive"
                    checked={form.aiActive}
                    onCheckedChange={(val) => setForm((f) => ({ ...f, aiActive: val }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="openaiKey">OpenAI API Key</Label>
                  <Input
                    id="openaiKey"
                    type="password"
                    placeholder="sk-..."
                    value={form.openaiKey}
                    onChange={(e) => setForm((f) => ({ ...f, openaiKey: e.target.value }))}
                    disabled={!form.aiActive}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiPrompt">Prompt do Agente (Instruções)</Label>
                  <Textarea
                    id="aiPrompt"
                    rows={4}
                    placeholder="Você é um assistente de vendas da Popular Click..."
                    value={form.aiPrompt}
                    onChange={(e) => setForm((f) => ({ ...f, aiPrompt: e.target.value }))}
                    disabled={!form.aiActive}
                  />
                </div>
              </div>

              <Button type="submit" className="bg-gradient-brand shadow-glow h-11 w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                Salvar Configurações
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="connect" className="p-6 focus-visible:outline-none">
            <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
              {!form.apiUrl || !form.instanceName ? (
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <WifiOff className="size-12 opacity-20" />
                  <p>Configure a API ou use a instalação automática direta.</p>
                  <Button 
                    onClick={handleInstallLocal} 
                    disabled={installing}
                    className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50"
                  >
                    {installing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MessageSquare className="mr-2 size-4" />}
                    Instalar Evolution Directo (Auto)
                  </Button>
                </div>
              ) : qrQuery.isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="size-12 animate-spin text-primary" />
                  <p>Gerando QR Code...</p>
                </div>
              ) : (!qrQuery.data?.connected) ? (
                <div className="space-y-4">
                  {qrQuery.data?.base64 ? (
                    <div className="inline-block rounded-3xl bg-white p-4 shadow-xl">
                      <img
                        src={qrQuery.data.base64}
                        alt="WhatsApp QR Code"
                        className="size-64"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-10">
                      <QrCode className="size-12 opacity-20" />
                      <p className="text-muted-foreground">QR Code expirado ou não gerado.</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="font-bold">Escaneie o QR Code</p>
                    <p className="text-muted-foreground text-sm">Abra o WhatsApp {">"} Dispositivos Conectados</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => qrQuery.refetch()}
                    className="gap-2"
                  >
                    <RefreshCw className="size-4" /> Atualizar QR Code
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Wifi className="size-12 text-green-500" />
                  <p className="text-lg font-bold text-green-500">Instância Conectada!</p>
                  <p className="text-muted-foreground text-sm">
                    Caso queira conectar outro número ou resetar, clique abaixo.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => qrQuery.refetch()}
                    >
                      <RefreshCw className="mr-2 size-4" /> Verificar Status
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={async () => {
                        if (confirm("Deseja realmente desconectar e gerar um novo QR Code?")) {
                          try {
                            setInstalling(true);
                            // Força a reinstalação/reset da instância para garantir que limpe sessões antigas
                            await installLocal({ data: credentials });
                            
                            // Limpa o cache para forçar refetch imediato
                            await queryClient.invalidateQueries({ queryKey: ["evolution-qr"] });
                            await queryClient.refetchQueries({ queryKey: ["evolution-qr"] });
                            
                            toast.success("Instância resetada! Gerando novo QR Code...");
                          } catch (e: any) {
                            toast.error("Erro ao resetar: " + e.message);
                          } finally {
                            setInstalling(false);
                          }
                        }
                      }}
                    >
                      Desconectar / Novo QR
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
