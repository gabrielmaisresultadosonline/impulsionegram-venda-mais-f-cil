import { Heart, UserPlus } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export interface Social3DIconsProps extends ComponentProps<"div"> {}

interface Coin3DProps {
  /** Ícone renderizado na face frontal da moeda 3D. */
  children: React.ReactNode;
  /** Rótulo acessível descrevendo o que a moeda representa. */
  label: string;
  /** Inverte o sentido da rotação para criar variação visual. */
  reverse?: boolean;
  className?: string;
}

/** Moeda com rotação 3D contínua, brilho e reflexo animado. */
function Coin3D({ children, label, reverse = false, className }: Coin3DProps) {
  return (
    <div className={cn("scene-3d animate-orbit-bob", className)} role="img" aria-label={label}>
      <div
        className={cn(
          "relative grid place-items-center rounded-full",
          reverse ? "animate-spin3d-rev" : "animate-spin3d",
        )}
      >
        {/* Halo luminoso */}
        <div className="bg-gradient-brand animate-pulse-glow absolute -inset-4 rounded-full blur-2xl" />

        {/* Corpo da moeda */}
        <div className="bg-gradient-brand shadow-glow relative grid size-full place-items-center overflow-hidden rounded-full border border-white/25">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.55),transparent_55%)]" />
          <div className="absolute inset-[14%] rounded-full border border-white/20" />
          <div className="animate-shine-sweep absolute inset-y-0 -left-1/2 w-1/2 bg-white/30 blur-md" />
          <div className="relative text-primary-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Composição 3D de ícones de curtida e seguidor, usada no lugar da imagem do hero.
 */
export function Social3DIcons({ className, ...props }: Social3DIconsProps) {
  return (
    <div
      className={cn("relative flex items-center justify-center gap-8 py-6 md:gap-14", className)}
      {...props}
    >
      <Coin3D label="Curtidas" className="size-20 md:size-28" reverse>
        <Heart className="size-9 fill-current md:size-12" aria-hidden="true" />
      </Coin3D>

      <Coin3D label="Novos seguidores" className="size-28 md:size-40">
        <UserPlus className="size-12 md:size-16" aria-hidden="true" />
      </Coin3D>

      <Coin3D label="Curtidas" className="size-20 md:size-28">
        <Heart className="size-9 fill-current md:size-12" aria-hidden="true" />
      </Coin3D>
    </div>
  );
}
