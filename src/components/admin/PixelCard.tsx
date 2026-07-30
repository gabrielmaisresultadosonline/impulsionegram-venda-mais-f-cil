import { useEffect, useState, type ComponentProps, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, Loader2, MousePointerClick, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminGetSettings, adminSetPixel } from "@/lib/admin.functions";

export interface PixelCardProps extends ComponentProps<"section"> {
  credentials: { email: string; password: string };
}

/**
 * Configuração do Pixel do Facebook e contadores de tráfego.
 * O Pixel ID é público (roda no navegador), mas só o admin pode alterá-lo.
 */
export function PixelCard({ credentials, className, ...props }: PixelCardProps) {
  const getSettings = useServerFn(adminGetSettings);
  const setPixel = useServerFn(adminSetPixel);
  const [pixelId, setPixelId] = useState("");

  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => getSettings({ data: credentials }),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (settingsQuery.data) setPixelId(settingsQuery.data.facebookPixelId);
  }, [settingsQuery.data]);

  const mutation = useMutation({
    mutationFn: (value: string) => setPixel({ data: { ...credentials, pixelId: value } }),
    onSuccess: () => {
      toast.success("Pixel salvo. Os eventos começam a contar nas próximas visitas.");
      void settingsQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível salvar o Pixel."),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = pixelId.trim();
    if (value && !/^\d{8,20}$/.test(value)) {
      toast.error("O Pixel ID deve conter apenas números (8 a 20 dígitos).");
      return;
    }
    mutation.mutate(value);
  };

  const stats = settingsQuery.data;

  return (
    <section className={cn("glass-panel rounded-2xl p-6", className)} {...props}>
      <header>
        <h2 className="text-lg font-bold">Pixel do Facebook</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Cadastre o ID do Pixel para contabilizar <strong>PageView</strong>,{" "}
          <strong>Lead</strong> (novo cadastro) e <strong>Purchase</strong> (venda aprovada).
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="pixel-id">Pixel ID</Label>
          <Input
            id="pixel-id"
            inputMode="numeric"
            value={pixelId}
            onChange={(event) => setPixelId(event.target.value)}
            placeholder="Ex.: 1234567890123456"
            maxLength={32}
          />
        </div>
        <Button
          type="submit"
          className="bg-gradient-brand shadow-glow h-10"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          Salvar Pixel
        </Button>
      </form>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <MiniStat
          icon={<Eye className="size-4" aria-hidden="true" />}
          label="Visitas na home"
          value={stats ? String(stats.visits) : "—"}
        />
        <MiniStat
          icon={<Users className="size-4" aria-hidden="true" />}
          label="Cadastros (lead)"
          value={stats ? String(stats.signups) : "—"}
        />
        <MiniStat
          icon={<MousePointerClick className="size-4" aria-hidden="true" />}
          label="Pixel ativo"
          value={stats?.facebookPixelId ? "Sim" : "Não"}
        />
      </dl>
    </section>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border-border flex items-center gap-3 rounded-xl border p-3">
      <span className="text-primary">{icon}</span>
      <div>
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="text-sm font-bold">{value}</dd>
      </div>
    </div>
  );
}
