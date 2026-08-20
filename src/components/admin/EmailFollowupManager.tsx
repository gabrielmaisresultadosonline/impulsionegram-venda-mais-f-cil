import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Eye, Clock, User, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { adminListEmailLogs } from "@/lib/email-admin.functions";
import type { AdminCredentials } from "@/routes/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmailFollowupManagerProps {
  credentials: AdminCredentials;
}

export function EmailFollowupManager({ credentials }: EmailFollowupManagerProps) {
  const listLogs = useServerFn(adminListEmailLogs);
  
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-email-logs"],
    queryFn: () => listLogs({ data: credentials }),
    refetchInterval: 30000,
  });

  // Agrupa logs por e-mail/NSU para ver o status do funil
  const logsByCustomer = logs.reduce((acc, log) => {
    const key = log.orderNsu;
    if (!acc[key]) {
      acc[key] = {
        name: log.customerName,
        email: log.customerEmail,
        nsu: log.orderNsu,
        sentLogs: [],
      };
    }
    acc[key].sentLogs.push(log);
    return acc;
  }, {} as Record<string, { name: string; email: string; nsu: string; sentLogs: any[] }>);

  const customerList = Object.values(logsByCustomer).sort((a, b) => {
    const lastA = new Date(a.sentLogs[a.sentLogs.length - 1].sentAt).getTime();
    const lastB = new Date(b.sentLogs[b.sentLogs.length - 1].sentAt).getTime();
    return lastB - lastA;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Mail className="size-5 text-primary" />
          E-mails e Followups
        </h2>
        <p className="text-muted-foreground text-sm">
          Acompanhe o engajamento dos leads e os e-mails automáticos enviados pela I.A.
        </p>
      </div>

      {isLoading ? (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          Carregando histórico de e-mails...
        </div>
      ) : customerList.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          Nenhum log de e-mail encontrado.
        </div>
      ) : (
        <div className="grid gap-4">
          {customerList.map((customer) => (
            <div key={customer.nsu} className="glass-panel p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">{customer.name}</span>
                  <Badge variant="outline" className="text-[10px] font-mono opacity-70">
                    {customer.nsu}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="size-3" />
                  {customer.email}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Emails Enviados</span>
                  <div className="flex gap-1">
                    {customer.sentLogs.map((log, idx) => (
                      <Dialog key={log.id}>
                        <DialogTrigger asChild>
                          <button className="hover:scale-110 transition-transform">
                            <Badge className="bg-primary/20 text-primary border-primary/30 cursor-pointer hover:bg-primary/30">
                              {idx + 1}
                            </Badge>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-card border-border">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Eye className="size-5" />
                              Prévia do E-mail
                            </DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 space-y-4">
                            <div className="grid gap-1 border-b border-border pb-4">
                              <p className="text-sm"><strong>Assunto:</strong> {log.subject}</p>
                              <p className="text-sm"><strong>Data:</strong> {format(new Date(log.sentAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                            </div>
                            <ScrollArea className="h-[400px] w-full rounded-md border border-border bg-muted/50 p-4">
                              <div className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                                {log.content}
                              </div>
                            </ScrollArea>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                </div>

                <div className="h-8 w-px bg-border hidden sm:block" />

                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Último envio</p>
                  <p className="text-sm font-medium">
                    {format(new Date(customer.sentLogs[customer.sentLogs.length - 1].sentAt), "dd/MM HH:mm")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
