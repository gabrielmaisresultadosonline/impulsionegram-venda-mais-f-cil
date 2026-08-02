import type { FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CampaignData, RegionMode } from "./types";

export interface CampaignStepProps {
  data: CampaignData;
  onChange: (patch: Partial<CampaignData>) => void;
  onBack?: () => void;
  /** Avança para a etapa seguinte do funil (planos e pagamento). */
  onSubmit: () => void;
  pending: boolean;
  /** Texto do botão principal. */
  submitLabel?: string;
  /** Texto exibido enquanto a ação está em andamento. */
  pendingLabel?: string;
}

const MODES: readonly { value: RegionMode; label: string }[] = [
  { value: "cidade", label: "Localização (cidade/estado)" },
  { value: "cep", label: "CEP" },
];

export function CampaignStep({
  data,
  onChange,
  onBack,
  onSubmit,
  pending,
  submitLabel = "Salvar e escolher plano",
  pendingLabel = "Salvando dados...",
}: CampaignStepProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (data.profileUrl.trim().length < 3) return toast.error("Informe o link do seu perfil.");
    if (data.regionValue.trim().length < 2)
      return toast.error(data.regionMode === "cep" ? "Informe o CEP." : "Informe a localização.");
    if (data.competitor.trim().length < 3)
      return toast.error("Informe o Instagram do concorrente.");
    if (data.customerName.trim().length < 2) return toast.error("Informe seu nome.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail.trim()))
      return toast.error("E-mail inválido.");
    if (data.customerPhone.replace(/\D/g, "").length < 10)
      return toast.error("Informe um WhatsApp válido com DDD.");
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <header>
        <h3 className="text-xl font-bold">Dados do seu perfil e do público</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Diga qual é o seu perfil e de onde quer o público (cidade ou CEP). Salvamos tudo
          no seu cadastro — depois é só escolher o plano e pagar.
        </p>
      </header>

      <div className="space-y-2">
        <Label htmlFor="profileUrl">Link do seu perfil *</Label>
        <Input
          id="profileUrl"
          value={data.profileUrl}
          onChange={(e) => onChange({ profileUrl: e.target.value })}
          placeholder="instagram.com/seu.perfil"
          maxLength={200}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Como quer filtrar a região? *</Label>
        <div className="flex gap-2">
          {MODES.map((mode) => (
            <Button
              key={mode.value}
              type="button"
              variant={data.regionMode === mode.value ? "default" : "outline"}
              onClick={() => onChange({ regionMode: mode.value, regionValue: "" })}
              className={cn("h-10 flex-1 text-xs sm:text-sm", data.regionMode === mode.value && "bg-gradient-brand")}
            >
              {mode.label}
            </Button>
          ))}
        </div>
        <Input
          id="regionValue"
          value={data.regionValue}
          onChange={(e) => onChange({ regionValue: e.target.value })}
          placeholder={data.regionMode === "cep" ? "76800-000" : "Porto Velho - RO"}
          aria-label={data.regionMode === "cep" ? "CEP da região" : "Cidade e estado"}
          maxLength={120}
          required
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="competitor">Instagram do concorrente *</Label>
          <Input
            id="competitor"
            value={data.competitor}
            onChange={(e) => onChange({ competitor: e.target.value })}
            placeholder="instagram.com/concorrente"
            maxLength={200}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerName">Nome *</Label>
          <Input
            id="customerName"
            value={data.customerName}
            onChange={(e) => onChange({ customerName: e.target.value })}
            maxLength={120}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerEmail">E-mail *</Label>
          <Input
            id="customerEmail"
            type="email"
            value={data.customerEmail}
            onChange={(e) => onChange({ customerEmail: e.target.value })}
            maxLength={160}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerPhone">WhatsApp *</Label>
          <Input
            id="customerPhone"
            value={data.customerPhone}
            onChange={(e) => onChange({ customerPhone: e.target.value })}
            placeholder="(69) 99999-9999"
            maxLength={30}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            disabled={pending}
            className="h-12"
          >
            Voltar
          </Button>
        ) : null}
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="bg-gradient-brand shadow-glow h-12 flex-1"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {pendingLabel}
            </>
          ) : (
            <>
              <ShieldCheck className="size-4" aria-hidden="true" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>

      <p className="text-muted-foreground text-center text-xs">
        Seus dados ficam salvos no cadastro mesmo se você pagar depois.
      </p>
    </form>
  );
}
