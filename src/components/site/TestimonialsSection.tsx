import { MessageSquare, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: number;
  name: string;
  location: string;
  message: string;
  time: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Ricardo Silva",
    location: "São Paulo, SP",
    message: "Cara, surreal! O anúncio rodou tem 2 horas e já tem 5 pessoas me chamando no WhatsApp querendo orçamento. Muito top!",
    time: "10:24",
  },
  {
    id: 2,
    name: "Ana Costa",
    location: "Rio de Janeiro, RJ",
    message: "Meu vídeo bateu 15 mil visualizações em um dia! O alcance é absurdo, nunca vi nada igual. Vale cada centavo.",
    time: "14:15",
  },
  {
    id: 3,
    name: "Marcos Lira",
    location: "Curitiba, PR",
    message: "Já estou com a agenda da semana cheia. O filtro por região funciona mesmo, só vem gente aqui do bairro. Incrível!",
    time: "09:45",
  },
  {
    id: 4,
    name: "Juliana Mendes",
    location: "Belo Horizonte, MG",
    message: "Tô chocada com a rapidez. Fiz o cadastro de manhã e agora à tarde o WhatsApp não para de apitar. Clientes reais mesmo!",
    time: "16:20",
  },
  {
    id: 5,
    name: "Felipe Almeida",
    location: "Salvador, BA",
    message: "Mano, o resultado veio muito rápido. O engajamento no post subiu demais e as vendas já começaram a sair. Recomendo!",
    time: "11:05",
  },
  {
    id: 6,
    name: "Carla Souza",
    location: "Porto Alegre, RS",
    message: "Melhor investimento que fiz esse ano. Gestão automática facilita muito a vida. Os leads são muito qualificados.",
    time: "13:40",
  },
  {
    id: 7,
    name: "Daniel Santos",
    location: "Brasília, DF",
    message: "Acabei de fechar uma venda de R$ 1.200 de um cliente que veio pelo anúncio hoje. Tá pago o investimento já!",
    time: "17:55",
  },
  {
    id: 8,
    name: "Patrícia Lima",
    location: "Fortaleza, CE",
    message: "O alcance das minhas publicações triplicou. Muita gente nova conhecendo a loja. Tô muito satisfeita com o serviço.",
    time: "08:30",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold md:text-4xl">
            O que nossos <span className="text-gradient-brand">clientes</span> dizem
          </h2>
          <p className="mt-4 text-muted-foreground">
            Feedbacks reais enviados diretamente no nosso WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="glass-panel p-5 rounded-2xl flex flex-col relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-green-500/10 p-2 rounded-full">
                  <MessageSquare className="size-4 text-green-500" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{t.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{t.location}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-3 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
              </div>
              
              <div className="bg-muted/30 p-3 rounded-xl rounded-tl-none border border-border/50 text-sm italic relative">
                "{t.message}"
                <span className="absolute bottom-1 right-2 text-[9px] text-muted-foreground">
                  {t.time}
                </span>
              </div>
              
              <div className="mt-4 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Verified Result
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
