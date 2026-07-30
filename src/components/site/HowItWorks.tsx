import { CreditCard, Images, MousePointerClick, Rocket } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "1. Escolha o plano",
    description: "Selecione o pacote de seguidores, curtidas ou o marketing completo de 30 dias.",
  },
  {
    icon: Images,
    title: "2. Envie o perfil e até 5 publicações",
    description: "Compartilhe o link do seu perfil e das fotos ou reels que quer impulsionar.",
  },
  {
    icon: CreditCard,
    title: "3. Pague com Pix ou cartão",
    description:
      "Checkout InfinitePay. A confirmação aparece em tempo real no seu painel de pedido.",
  },
  {
    icon: Rocket,
    title: "4. Aguarde até 6 horas",
    description: "O resultado começa a entrar no perfil em até 6 horas após a aprovação.",
  },
] as const;

export function HowItWorks({ className, ...props }: ComponentProps<"section">) {
  return (
    <section className={cn("px-4 py-20", className)} {...props}>
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-extrabold text-balance md:text-4xl">Como funciona</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Quatro passos simples entre o seu perfil de hoje e um perfil com prova social de verdade.
        </p>

        <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="glass-panel rounded-2xl p-6">
              <span className="bg-gradient-brand text-primary-foreground flex size-11 items-center justify-center rounded-xl">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
