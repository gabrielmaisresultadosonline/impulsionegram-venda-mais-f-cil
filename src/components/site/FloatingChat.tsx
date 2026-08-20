import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User, Phone, Mail, UserCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { sendMessageToAI } from "@/lib/ai-chat.functions";
import { getAccount, type LocalAccount } from "@/lib/account-storage";

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"form" | "chat">("form");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [visitor, setVisitor] = useState<Partial<LocalAccount>>({});
  const chatFn = useServerFn(sendMessageToAI);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const account = getAccount();
    if (account) {
      setVisitor(account);
      setStep("chat");
    } else {
      const savedVisitor = localStorage.getItem("chat_visitor");
      if (savedVisitor) {
        setVisitor(JSON.parse(savedVisitor));
        setStep("chat");
      }
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const mutation = useMutation({
    mutationFn: (text: string) => chatFn({ data: { message: text, visitor: visitor as any } }),
    onSuccess: (res) => {
      setMessages((prev) => [...prev, { role: "ai", text: res.text }]);
    },
  });

  const handleStart = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      phone: String(fd.get("phone")),
    };
    setVisitor(data);
    localStorage.setItem("chat_visitor", JSON.stringify(data));
    setStep("chat");
    setMessages([{ role: "ai", text: `Olá ${data.name.split(" ")[0]}! Como posso ajudar você hoje?` }]);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || mutation.isPending) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    mutation.mutate(text);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-brand text-white p-4 rounded-full shadow-glow animate-bounce hover:scale-110 transition-transform"
      >
        <MessageSquare className="size-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[350px] max-w-[90vw] h-[500px] flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      <header className="bg-gradient-brand p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="size-6" />
          <div>
            <h3 className="font-bold text-sm">Atendimento Acessar I.A</h3>
            <div className="flex items-center gap-1.5">
              <span className="size-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] opacity-90">Online agora</span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg">
          <X className="size-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {step === "form" ? (
          <form onSubmit={handleStart} className="space-y-4 py-4">
            <p className="text-xs text-muted-foreground text-center mb-2">
              Olá! Identifique-se para começar a conversar com nossa I.A.
            </p>
            <div className="space-y-2">
              <div className="relative">
                <UserCircle className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input name="name" placeholder="Nome completo" className="pl-10" required />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input name="email" type="email" placeholder="E-mail" className="pl-10" required />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input name="phone" placeholder="WhatsApp" className="pl-10" required />
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-brand">
              Começar conversa
            </Button>
          </form>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2 max-w-[85%]",
                m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0", m.role === "ai" ? "bg-primary/10" : "bg-muted")}>
                {m.role === "ai" ? <Bot className="size-4 text-primary" /> : <User className="size-4" />}
              </div>
              <div
                className={cn(
                  "p-3 rounded-2xl text-sm",
                  m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"
                )}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
        {mutation.isPending && (
          <div className="flex gap-2 mr-auto animate-pulse">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="size-4 text-primary" />
            </div>
            <div className="bg-muted p-3 rounded-2xl rounded-tl-none text-xs">Digitando...</div>
          </div>
        )}
      </div>

      {step === "chat" && (
        <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            disabled={mutation.isPending}
          />
          <Button type="submit" size="icon" className="bg-gradient-brand shrink-0" disabled={!input.trim() || mutation.isPending}>
            <Send className="size-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
