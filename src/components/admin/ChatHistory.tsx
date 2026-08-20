import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, User, MessageSquare, Clock, Send, Loader2 } from "lucide-react";
import { adminListAllChats } from "@/lib/ai-chat.functions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ChatHistory({ credentials }: { credentials: any }) {
  const listChats = useServerFn(adminListAllChats);

  const query = useQuery({
    queryKey: ["admin-chats"],
    queryFn: () => listChats({ data: credentials }),
    refetchInterval: 10000,
  });

  const { visitors = [], customers = [] } = query.data || {};
  const allChats = [...visitors.map(v => ({ ...v, type: 'visitor' })), ...customers];

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (allChats.length === 0) {
    return (
      <div className="border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
        Nenhuma conversa ativa no momento.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {allChats.map((chat: any) => (
        <article key={chat.id || chat.email} className="glass-panel border border-border rounded-xl overflow-hidden flex flex-col">
          <header className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-bold text-sm truncate">{chat.name || "Visitante"}</h3>
              <Badge variant={chat.type === 'customer' ? 'default' : 'secondary'} className="text-[10px]">
                {chat.type === 'customer' ? 'CADASTRADO' : 'VISITANTE'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{chat.email}</p>
            {chat.phone && <p className="text-[10px] text-primary mt-1 font-semibold">{chat.phone}</p>}
          </header>

          <div className="flex-1 p-4 max-h-[200px] overflow-y-auto space-y-3 bg-background/50">
            {chat.messages.slice(-3).map((msg: any, idx: number) => (
              <div key={idx} className={cn("flex gap-2 text-xs", msg.author === 'admin' ? "flex-row-reverse" : "")}>
                <div className="size-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {msg.author === 'ai' ? <Bot className="size-3 text-primary" /> : <User className="size-3" />}
                </div>
                <div className={cn("p-2 rounded-lg max-w-[80%]", msg.author === 'admin' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <footer className="p-3 border-t border-border bg-muted/10 mt-auto">
            <Button variant="outline" size="sm" className="w-full text-xs h-8">
              <MessageSquare className="size-3 mr-2" />
              Assumir Chat
            </Button>
          </footer>
        </article>
      ))}
    </div>
  );
}
