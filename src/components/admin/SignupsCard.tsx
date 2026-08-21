import { type ComponentProps } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mail, RefreshCw, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminListSignups, type AdminSignup } from "@/lib/admin.functions";
import { adminResendWelcomeEmailFinal } from "@/lib/admin-emails.functions";
import { sourceLabel } from "@/lib/traffic-source";
import { toast } from "sonner";

export interface SignupsCardProps extends ComponentProps<"section"> {
  credentials: { email: string; password: string };
}

/** Lista de contas criadas na home, com data e hora do cadastro. */
export function SignupsCard({ credentials, className, ...props }: SignupsCardProps) {
  const listSignups = useServerFn(adminListSignups);
  const resendEmail = useServerFn(adminResendWelcomeEmailFinal);

  const query = useQuery({
    queryKey: ["admin-signups"],
    queryFn: () => listSignups({ data: credentials }),
    refetchInterval: 30000,
  });

  const signups: AdminSignup[] = query.data ?? [];

  return (
    <section className={cn("glass-panel rounded-2xl p-6", className)} {...props}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Cadastros realizados</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Todas as contas criadas no site, com nome, e-mail e horário do cadastro.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-muted-foreground">
            {signups.length} {signups.length === 1 ? "cadastro" : "cadastros"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw
              className={cn("size-4", query.isFetching && "animate-spin")}
              aria-hidden="true"
            />
            Atualizar
          </Button>
        </div>
      </header>

      <div className="mt-5 space-y-3">
        {query.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Carregando cadastros...
          </div>
        ) : signups.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum cadastro registrado ainda.
          </p>
        ) : (
          signups.map((signup) => (
            <article
              key={signup.email}
              className="border-border grid gap-3 rounded-xl border p-4 sm:grid-cols-3 lg:grid-cols-7 relative"
            >
              <Field label="Nome">
                <span className="flex items-center gap-2">
                  <UserRound className="text-primary size-4" aria-hidden="true" />
                  {signup.name || "—"}
                  {signup.source === "home" && (
                    <Badge className="bg-blue-600 text-white border-transparent hover:bg-blue-700 animate-pulse text-[10px] h-4">
                      NOVO
                    </Badge>
                  )}
                </span>
              </Field>
              <Field label="E-mail">
                <span className="break-all">{signup.email}</span>
              </Field>
              <Field label="WhatsApp">
                <div className="flex items-center gap-2">
                  {signup.phone ? (
                    <a
                      href={`https://wa.me/${signup.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {signup.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </Field>
              <Field label="Veio de">
                <Badge variant="outline" className="border-primary/40 text-primary">
                  {sourceLabel(signup.source)}
                </Badge>
              </Field>
              <Field label="Cadastrado em">{formatDateTime(signup.createdAt)}</Field>
              <Field label="Último acesso / tentativas">
                {formatDateTime(signup.lastSeenAt)} · {signup.attempts}x
              </Field>
              <Field label="Perfil do Instagram">
                <span className="break-all">{signup.profileUrl || "—"}</span>
              </Field>
              <Field label="Público (região / CEP)">{signup.region || "—"}</Field>
              <Field label="Concorrente">
                <span className="break-all">{signup.competitor || "—"}</span>
              </Field>
              <div className="lg:col-span-2">
                <Field label="Link da Publicação">
                  <span className="break-all text-xs text-primary font-mono">{signup.adLink || "—"}</span>
                </Field>
              </div>
              <div className="flex items-end justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] gap-1.5 border-primary/20 hover:bg-primary/10"
                  onClick={async () => {
                    const promise = resendEmail({ 
                      data: { 
                        adminEmail: credentials.email,
                        adminPassword: credentials.password, 
                        customerEmail: signup.email 
                      } 
                    });
                    
                    toast.promise(promise, {
                      loading: 'Reenviando e-mail...',
                      success: (raw) => {
                        const res = raw as { success?: boolean; error?: string };
                        console.log('[SignupsCard] Resposta do reenvio:', res);
                        if (res.success) return 'E-mail de boas-vindas reenviado!';
                        throw new Error(res.error || 'Erro desconhecido ao enviar');
                      },
                      error: (err) => {
                        console.error('[SignupsCard] Erro capturado no toast:', err);
                        return `Falha: ${err.message}`;
                      }
                    });
                  }}
                >
                  <Mail className="size-3" />
                  Reenviar Boas-vindas
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{children}</p>
    </div>
  );
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
