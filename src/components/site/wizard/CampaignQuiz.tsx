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
  /**
   * Quando `false` o quiz não pergunta o WhatsApp — ele já veio do cadastro.
   * Só voltamos a perguntar em contas antigas que não guardaram o telefone.
   */
  askPhone?: boolean;
}

/**
 * Quiz de configuração da campanha: uma pergunta por tela.
 *
 * Perfil → região (CEP ou cidade/estado, apenas Brasil) → concorrente →
 * (WhatsApp, só se faltar no cadastro) → confirmação.
 */
export function CampaignQuiz({ data, onChange, onSubmit, pending, askPhone = false }: CampaignQuizProps) {
  const [index, setIndex] = useState(0);

  /** Ordem das perguntas exibidas — o WhatsApp entra apenas quando necessário. */
  const questions = useMemo(
    () => (["adLink", "profile", "region", "competitor"] as const),
    [],
  );
  const totalQuestions = questions.length;
  const currentQuestion = questions[index];

  const regionSummary = useMemo(() => {
    const value = data.regionValue.trim();
    return data.regionMode === "cep" ? `do CEP ${value}` : `da cidade/estado — ${value}`;
  }, [data.regionMode, data.regionValue]);

  /** Valida a pergunta atual antes de liberar o avanço. */
  const validate = (): boolean => {
    if (currentQuestion === "adLink" && data.adLink.trim().length < 10) {
      toast.error("Informe o link da publicação (propaganda) que vamos anunciar.");
      return false;
    }
    if (currentQuestion === "profile" && data.profileUrl.trim().length < 3) {
      toast.error("Informe o @ ou o link do seu Instagram.");
      return false;
    }
    if (currentQuestion === "region") {
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
    if (currentQuestion === "competitor" && data.competitor.trim().length < 3) {
      toast.error("Informe o Instagram do concorrente.");
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    setIndex((current) => Math.min(current + 1, totalQuestions));
  };

  const back = () => setIndex((current) => Math.max(current - 1, 0));

  const isSummary = index === totalQuestions;


  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-muted-foreground flex items-center justify-between text-xs font-semibold">
          <span>{isSummary ? "Tudo pronto" : `Pergunta ${index + 1} de ${totalQuestions}`}</span>
          <span>{Math.round(((isSummary ? totalQuestions : index) / totalQuestions) * 100)}%</span>
        </div>
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-gradient-brand h-full rounded-full transition-all duration-500"
            style={{
              width: `${((isSummary ? totalQuestions : index) / totalQuestions) * 100}%`,
            }}
          />
        </div>
      </div>

      {currentQuestion === "adLink" ? (
        <Question
          icon={<Instagram className="size-5" aria-hidden="true" />}
          title="Manda o link da sua propaganda?"
          description="A mesma que você quer anunciar no Instagram/Facebook."
        >
          <Label htmlFor="quiz-ad-link" className="sr-only">
            link da sua publicação no instagram, vamos usar o instagram para anunciar apartir de agora.
          </Label>
          <div className="space-y-4">
            <p className="text-sm font-medium">
              coloque link da publicação que vamos anunciar.
            </p>
            <Input
              id="quiz-ad-link"
              autoFocus
              value={data.adLink}
              onChange={(event) => onChange({ adLink: event.target.value })}
              onKeyDown={(event) => event.key === "Enter" && next()}
              placeholder="Apenas link de publicação"
              maxLength={500}
              className="h-12 text-base"
            />
          </div>
        </Question>
      ) : null}

      {currentQuestion === "profile" ? (
        <Question
          icon={<Instagram className="size-5" aria-hidden="true" />}
          title="Link ou @ do seu Instagram"
          description="Siga para a próxima etapa."
        >
          <Label htmlFor="quiz-profile" className="sr-only">
            @seu.perfil ou instagram.com/seu.perfil
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

      {currentQuestion === "region" ? (
        <Question
          icon={<MapPin className="size-5" aria-hidden="true" />}
          title="Qual localização do nosso anuncio?"
          description="Aonde quer que mostramos seu anuncio. Vamos colocar um raio de km em volta da sua localização de no mínimo 40km, podendo ser mais, mas nunca menos."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                { value: "cep", label: "Por CEP" },
                { value: "cidade", label: "Por Cidade" },
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
            {data.regionMode === "cep" ? "CEP" : "Cidade"}
          </Label>
          <Input
            id="quiz-region"
            value={data.regionValue}
            onChange={(event) => onChange({ regionValue: event.target.value })}
            onKeyDown={(event) => event.key === "Enter" && next()}
            placeholder={data.regionMode === "cep" ? "76800-000" : "Sua cidade (Ex.: São Paulo - SP)"}
            inputMode={data.regionMode === "cep" ? "numeric" : "text"}
            maxLength={120}
            className="h-12 text-base"
          />
        </Question>
      ) : null}

      {currentQuestion === "competitor" ? (
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


      {isSummary ? (
        <Question
          icon={<PartyPopper className="size-5" aria-hidden="true" />}
          title="É isso que precisa?"
          description="Confirme os dados da sua campanha de anúncios."

        >
          <div className="border-primary/30 bg-primary/5 space-y-3 rounded-2xl border p-5">
            <p className="text-base font-semibold text-balance">
              Esta campanha vai gerar novos clientes, públicos quentes e conversões direto para seu WhatsApp.
            </p>
            <p className="text-base font-semibold text-balance mt-3">
              Público <span className="text-gradient-brand">{regionSummary}</span> para o link{" "}

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

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-stretch gap-3 sm:flex sm:flex-row">
        {index > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={back}
            disabled={pending}
            className="h-14 w-full min-w-0 px-2 text-sm sm:h-12 sm:w-auto sm:px-6"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar
          </Button>
        ) : (
          <div aria-hidden="true" className="hidden sm:block" />
        )}
        <Button
          type="button"
          size="lg"
          onClick={isSummary ? onSubmit : next}
          disabled={pending}
          className="bg-gradient-brand shadow-glow h-14 w-full min-w-0 flex-1 px-3 text-sm font-bold whitespace-normal sm:h-12 sm:px-6 sm:text-base"
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
