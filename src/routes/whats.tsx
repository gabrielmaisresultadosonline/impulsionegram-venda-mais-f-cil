import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { trackPixelEvent } from "@/lib/pixel.functions";
import { trackSiteEvent } from "@/lib/pixel.functions";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/whats")({
  head: () => ({
    meta: [
      { title: "Fale no WhatsApp — POPULAR" },
      {
        name: "description",
        content:
          "Mais vendas, mais engajamento e mais clientes. Fale com a POPULAR no WhatsApp e tire suas dúvidas em segundos.",
      },
      {
        property: "og:title",
        content: "Fale no WhatsApp — POPULAR",
      },
      {
        property: "og:description",
        content:
          "Mais vendas, mais engajamento e mais clientes. Fale com a POPULAR no WhatsApp.",
      },
    ],
  }),
  component: WhatsPage,
});

const PHONE = "5551974001588";
const MESSAGE = "Estou no site CRESCIMENTO Instagram, gostaria de tirar algumas dúvidas";

function WhatsPage() {
  useEffect(() => {
    void trackSiteEvent({ data: { type: "pageview" } });
  }, []);

  const handleClick = () => {
    // Dispara o Lead tanto no navegador quanto no CAPI.
    trackPixelEvent("Lead", { contentName: "WhatsApp Direct" });
    void trackSiteEvent({ data: { type: "signup" } });
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Halo decorativo sutil, igual ao da homepage. */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500/20 to-orange-500/20 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-balance text-foreground md:text-6xl">
          <span className="block whitespace-nowrap">Mais vendas,</span>
          <span className="block whitespace-nowrap">Mais Engajamento</span>
          <span className="block whitespace-nowrap">Mais Clientes</span>
        </h1>

        <p className="mt-5 max-w-xl text-xl leading-snug font-semibold text-balance text-muted-foreground md:text-2xl">
          Público filtrado por região e CEP{" "}
          <span className="text-gradient-brand">no automático.</span>
        </p>

        <p className="mt-6 max-w-xl text-base text-pretty text-muted-foreground md:text-lg">
          Basta uma configuração e você faz tudo direto pelo celular. Ganhe seguidores filtrados por
          cidade, região e pelo perfil do seu concorrente — sem esforço manual.
        </p>

        <a
          href={`https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className={cn(
            "mt-10 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-8 py-5",
            "text-lg font-bold text-white shadow-lg shadow-green-500/25",
            "transition-all duration-200 hover:scale-[1.02] hover:bg-[#1ebd59] hover:shadow-xl",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "sm:w-auto sm:px-14 sm:py-6 sm:text-xl",
          )}
          aria-label="Fale conosco no WhatsApp"
        >
          <WhatsAppIcon className="size-7 sm:size-8" />
          Falar no WhatsApp
        </a>

        <p className="mt-6 text-sm text-muted-foreground">
          Você será redirecionado para o WhatsApp com sua mensagem pré-preenchida.
        </p>
      </div>
    </main>
  );
}
