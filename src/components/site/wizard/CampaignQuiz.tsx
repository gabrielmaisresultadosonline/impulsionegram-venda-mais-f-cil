import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Instagram, Loader2, MapPin, PartyPopper, Phone, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CampaignData, RegionMode } from "./types";

export interface CampaignQuizProps {
  data: CampaignData;
  onChange: (patch: Partial<CampaignData>) => void;
  /** Salva os dados e avança para a escolha do plano. */
  onSubmit: () => void;
  pending: boolean;
}

const TOTAL_QUESTIONS = 4;

/**
 * Quiz de configuração da campanha: uma pergunta por tela.
 *
 * Perfil → região (CEP ou cidade/estado, apenas Brasil) → concorrente →
 * WhatsApp → confirmação. A confirmação repete a escolha do público antes
 * de liberar os planos.
 */
export function CampaignQuiz({ data, onChange, onSubmit, pending }: CampaignQuizProps) {
  const [index, setIndex] = useState(0);

  const regionSummary = useMemo(() => {
    const value = data.regionValue.trim();
    return data.regionMode === "cep" ? `do CEP ${value}` : `da cidade/estado — ${value}`;
  }, [data.regionMode, data.regionValue]);

  /** Valida a pergunta atual antes de liberar o avanço. */
  const validate = (): boolean => {
    if (index === 0 && data.profileUrl.trim().length < 3) {
      toast.error("Informe o @ ou o link do seu Instagram.");
      return false;
    }
    if (index === 1) {
      const value = data.regionValue.trim();
      if (data.regionMode === "cep" && value.replace(/\D/g, "").length !== 8) {
        toast.error("Informe um CEP brasileiro válido (8 dígitos).");
        return false;
      }
      if (data.regionMode === "cidade" && value.length < 3) {
        toast.error("Informe a cidade e o estado. Ex.: Porto Velho - RO");
        return false;
      }
    }
    if (index === 2 && data.competitor.trim().length < 3) {
      toast.error("Informe o Instagram do concorrente.");
      return false;
    }
    if (index === 3 && data.customerPhone.replace(/\D/g, "").length < 10) {
      toast.error("Informe um WhatsApp válido com DDD.");
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    setIndex((current) => Math.min(current + 1, TOTAL_QUESTIONS));
  };

  const back = () => setIndex((current) => Math.max(current - 1, 0));

  const isSummary = index === TOTAL_QUESTIONS;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-muted-foreground flex items-center justify-between text-xs font-semibold">
          <span>{isSummary ? "Tudo pronto" : `Pergunta ${index + 1} de ${TOTAL_QUESTIONS}`}</span>
          <span>{Math.round(((isSummary ? TOTAL_QUESTIONS : index) / TOTAL_QUESTIONS) * 100)}%</span>
        </div>
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-gradient-brand h-full rounded-full transition-all duration-500"
            style={{
              width: `${((isSummary ? TOTAL_QUESTIONS : index) / TOTAL_QUESTIONS) * 100}%`,
            }}
          />
        </div>
      </div>

      {index === 0 ? (
        <Question
          icon={<Instagram className="size-5" aria-hidden="true" />}
          title="Qual é o seu Instagram?"
          description="É nesse perfil que o engajamento vai aparecer."
        >
          <Label htmlFor="quiz-profile" className="sr-only">
            Link ou @ do seu Instagram
          </Label>
          <Input
            id="quiz-profile"
            autoFocus
            value={data.profileUrl}
            onChange={(event) => onChange({ profileUrl: event.target.value })}
            onKeyDown={(event) => event.key === "Enter" && next()}
            placeholder="@seu.perfil ou instagram.com/seu.perfil"
            maxLength={200}
            className="h-12 text-base"
          />
        </Question>
      ) : null}

      {index === 1 ? (
        <Question
          icon={<MapPin className="size-5" aria-hidden="true" />}
          title="De onde você quer o seu público?"
          description="Trabalhamos apenas com público brasileiro. Escolha por CEP ou cidade/estado."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                { value: "cep", label: "Por CEP" },
                { value: "cidade", label: "Por cidade / estado" },
              ] satisfies { value: RegionMode; label: string }[]
            ).map((mode) => (
              <Button
                key={mode.value}
                type="button"
                variant={data.regionMode === mode.value ? "default" : "outline"}
                onClick={() => onChange({ regionMode: mode.value, regionValue: "" })}
                className={cn("h-12", data.regionMode === mode.value && "bg-gradient-brand")}
              >
                {mode.label}
              </Button>
            ))}
          </div>
          <Label htmlFor="quiz-region" className="sr-only">
            {data.regionMode === "cep" ? "CEP" : "Cidade e estado"}
          </Label>
          <Input
            id="quiz-region"
            value={data.regionValue}
            onChange={(event) => onChange({ regionValue: event.target.value })}
            onKeyDown={(event) => event.key === "Enter" && next()}
            placeholder={data.regionMode === "cep" ? "76800-000" : "Porto Velho - RO"}
            inputMode={data.regionMode === "cep" ? "numeric" : "text"}
            maxLength={120}
            className="h-12 text-base"
          />
        </Question>
      ) : null}

      {index === 2 ? (
        <Question
          icon={<Target className="size-5" aria-hidden="true" />}
          title="Qual concorrente tem o público que você quer?"
          description="Usamos o perfil dele como referência para filtrar pessoas do mesmo interesse."
        >
          <Label htmlFor="quiz-competitor" className="sr-only">
            Instagram do concorrente
          </Label>
          <Input
            id="quiz-competitor"
            autoFocus
            value={data.competitor}
            onChange={(event) => onChange({ competitor: event.target.value })}
            onKeyDown={(event) => event.key === "Enter" && next()}
            placeholder="@concorrente"
            maxLength={200}
            className="h-12 text-base"
          />
        </Question>
      ) : null}

      {index === 3 ? (
        <Question
          icon={<Phone className="size-5" aria-hidden="true" />}
          title="Qual o seu WhatsApp?"
          description="Só usamos para avisar sobre a entrega do seu engajamento."
        >
          <Label htmlFor="quiz-phone" className="sr-only">
            WhatsApp com DDD
          </Label>
          <Input
            id="quiz-phone"
            autoFocus
            value={data.customerPhone}
            onChange={(event) => onChange({ customerPhone: event.target.value })}
            onKeyDown={(event) => event.key === "Enter" && next()}
            placeholder="(69) 99999-9999"
            inputMode="tel"
            maxLength={30}
            className="h-12 text-base"
          />
        </Question>
      ) : null}

      {isSummary ? (
        <Question
          icon={<PartyPopper className="size-5" aria-hidden="true" />}
          title="OK, já entendemos!"
          description=""
        >
          <div className="border-primary/30 bg-primary/5 space-y-3 rounded-2xl border p-5">
            <p className="text-base font-semibold text-balance">
              Você precisa de público{" "}
              <span className="text-gradient-brand">{regionSummary}</span> para o perfil{" "}
              <span className="text-gradient-brand break-all">{data.profileUrl.trim()}</span>.
            </p>
            <p className="text-muted-foreground text-sm">
              Referência de público: <strong>{data.competitor.trim()}</strong>
            </p>
            <p className="text-muted-foreground text-sm">
              Para avançar com o seu alcance e iniciar todo o engajamento, escolha um plano na
              próxima etapa.
            </p>
          </div>
        </Question>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {index > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={back}
            disabled={pending}
            className="h-12 sm:w-auto"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar
          </Button>
        ) : null}
        <Button
          type="button"
          size="lg"
          onClick={isSummary ? onSubmit : next}
          disabled={pending}
          className="bg-gradient-brand shadow-glow h-12 flex-1"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Salvando...
            </>
          ) : (
            <>
              {isSummary ? "Escolher meu plano" : "Avançar"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>

      <p className="text-muted-foreground text-center text-xs">
        Seus dados ficam salvos no cadastro mesmo se você pagar depois.
      </p>
    </div>
  );
}

interface QuestionProps {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}

function Question({ icon, title, description, children }: QuestionProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300">
      <header className="space-y-2">
        <span className="bg-primary/10 text-primary inline-flex size-11 items-center justify-center rounded-2xl">
          {icon}
        </span>
        <h3 className="text-xl font-extrabold text-balance md:text-2xl">{title}</h3>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </header>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
