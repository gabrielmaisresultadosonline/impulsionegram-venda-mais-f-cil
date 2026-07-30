import type { FormEvent } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL, type Plan } from "@/lib/plans";
import { MAX_POSTS, MIN_POSTS } from "./types";

export interface PostsStepProps {
  posts: string[];
  onChange: (index: number, value: string) => void;
  plan: Plan | undefined;
  pending: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export function PostsStep({ posts, onChange, plan, pending, onBack, onSubmit }: PostsStepProps) {
  const filled = posts.filter((post) => post.trim().length > 3).length;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plan) return toast.error("Selecione um plano antes de continuar.");
    if (filled < MIN_POSTS)
      return toast.error(`Envie no mínimo ${MIN_POSTS} links de publicação.`);
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <header>
        <h3 className="text-xl font-bold">Publicações para impulsionar</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Envie de {MIN_POSTS} a {MAX_POSTS} links de fotos ou reels do seu perfil. Os
          {" "}{MIN_POSTS} primeiros são obrigatórios.
        </p>
      </header>

      <div className="border-border space-y-3 rounded-2xl border p-5">
        {posts.map((post, index) => (
          <div key={`post-${index}`} className="space-y-1">
            <Input
              value={post}
              onChange={(event) => onChange(index, event.target.value)}
              placeholder={`Link da publicação ${index + 1}${index < MIN_POSTS ? " *" : " (opcional)"}`}
              aria-label={`Link da publicação ${index + 1}`}
              maxLength={300}
              required={index < MIN_POSTS}
            />
          </div>
        ))}
        <p className="text-muted-foreground text-xs">
          {filled}/{MAX_POSTS} links informados — mínimo {MIN_POSTS}.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="outline" size="lg" onClick={onBack} className="h-12">
          Voltar
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={pending || !plan}
          className="bg-gradient-brand shadow-glow h-12 flex-1"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Lock className="size-4" aria-hidden="true" />
          )}
          {pending ? "Gerando pagamento..." : `Salvar e pagar ${plan ? formatBRL(plan.priceCents) : ""}`}
        </Button>
      </div>

      <p className="text-muted-foreground text-center text-xs">
        Pagamento processado pela InfinitePay (Pix ou cartão). A confirmação aparece
        automaticamente no seu painel.
      </p>
    </form>
  );
}
