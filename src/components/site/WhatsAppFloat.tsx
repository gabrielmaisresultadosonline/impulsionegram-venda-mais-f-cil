import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import type { ComponentProps } from "react";

export interface WhatsAppFloatProps extends ComponentProps<"a"> {
  /** Número de telefone no formato internacional, sem + ou espaços. */
  phone?: string;
  /** Mensagem pré-preenchida ao abrir o WhatsApp. */
  message?: string;
  /** Rótulo acessível para leitores de tela. */
  label?: string;
}

export function WhatsAppFloat({
  phone = "5551974001588",
  message = "Estou no site CRESCIMENTO Instagram, gostaria de tirar algumas dúvidas",
  label = "Fale conosco no WhatsApp",
  className,
  ...props
}: WhatsAppFloatProps) {
  const encodedMessage = encodeURIComponent(message);
  const href = `https://wa.me/${phone}?text=${encodedMessage}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-whatsapp-float",
        className,
      )}
      {...props}
    >
      <WhatsAppIcon className="size-6" />
      <span className="hidden text-sm font-semibold sm:inline">WhatsApp</span>
    </a>
  );
}
