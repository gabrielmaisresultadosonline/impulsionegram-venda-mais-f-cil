import { useState, type ComponentProps, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminSendPurchaseEvent } from "@/lib/admin.functions";

export interface ManualPurchaseCardProps extends ComponentProps<"section"> {
  credentials: { email: string; password: string };
}

/**
 * Envio manual de um evento Purchase para a API de Conversões do Meta.
 *
 * Serve para contabilizar uma venda real que não chegou ao Facebook. O
 * event_id é derivado do identificador do pedido, então reenviar o mesmo
 * pedido não gera conversão duplicada.
 */
export function ManualPurchaseCard({
  credentials,
  className,
  ...props
}: ManualPurchaseCardProps) {
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [value, setValue] = useState("");
  const [contentName, setContentName] = useState("");
  const [orderId, setOrderId] = useState("");

  const send = useServerFn(adminSendPurchaseEvent);

  const mutation = useMutation({
    mutationFn: () =>
      send({
        data: {
          ...credentials,
          buyerEmail: buyerEmail.trim(),
          buyerPhone: buyerPhone.trim() || undefined,
          value: Number(value.replace(",", ".")) || 0,
          contentName: contentName.trim() || undefined,
          orderId: orderId.trim(),
        },
      }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Evento de compra enviado ao Facebook.");
      } else {
        toast.error("O Meta não confirmou o evento. Verifique o token/Pixel no servidor.");
      }
    },
    onError: (error: Error) => toast.error(error.message || "Falha ao enviar o evento."),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!buyerEmail.trim() || !orderId.trim()) {
      toast.error("Informe o e-mail do comprador e o identificador do pedido.");
      return;
    }
    mutation.mutate();
  };

  return (
    <section className={cn("glass-panel rounded-2xl p-6", className)} {...props}>
      <h2 className="text-lg font-bold">Enviar compra manual ao Facebook</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Use quando uma venda aprovada não foi contabilizada no Pixel.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mp-email">E-mail do comprador</Label>
          <Input
            id="mp-email"
            type="email"
            value={buyerEmail}
            onChange={(event) => setBuyerEmail(event.target.value)}
            placeholder="cliente@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mp-phone">WhatsApp (opcional)</Label>
          <Input
            id="mp-phone"
            value={buyerPhone}
            onChange={(event) => setBuyerPhone(event.target.value)}
            placeholder="11999999999"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mp-value">Valor da venda (R$)</Label>
          <Input
            id="mp-value"
            inputMode="decimal"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="29"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mp-order">Identificador do pedido</Label>
          <Input
            id="mp-order"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="order_nsu"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="mp-plan">Nome do plano (opcional)</Label>
          <Input
            id="mp-plan"
            value={contentName}
            onChange={(event) => setContentName(event.target.value)}
            placeholder="Impulso 2.000"
          />
        </div>
        <Button type="submit" disabled={mutation.isPending} className="sm:col-span-2">
          {mutation.isPending ? "Enviando..." : "Enviar evento de compra"}
        </Button>
      </form>
    </section>
  );
}
