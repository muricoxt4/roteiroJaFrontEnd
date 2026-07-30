import { useState } from 'react';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarDays, PackageCheck, ShoppingCart, Ticket, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { session } from '@/services/api.js';
import { closeCart, getCart, removeCartItem } from '@/services/packages.js';
import { formatDate, formatTime, formatPrice } from '@/lib/utils';

export const Route = createFileRoute('/carrinho')({
  beforeLoad: () => {
    if (!session.getToken()) throw redirect({ to: '/login' });
  },
  component: CartPage,
});

function CartPage() {
  const queryClient = useQueryClient();
  const [issuedTickets, setIssuedTickets] = useState(null);

  const { data: cart, isLoading } = useQuery({ queryKey: ['cart'], queryFn: getCart });

  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removido do pacote.');
    },
    onError: (error) => toast.error(error.message),
  });

  const closeMutation = useMutation({
    mutationFn: closeCart,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIssuedTickets(data.tickets);
      toast.success('Pacote fechado! Seus tickets foram emitidos.');
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.error(error.message);
    },
  });

  // Tela de sucesso com os tickets emitidos.
  if (issuedTickets) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="text-center">
          <PackageCheck className="mx-auto size-14 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Pacote fechado com sucesso!</h1>
          <p className="mt-2 text-muted-foreground">
            Suas vagas estão reservadas. Entre em contato com cada agência para efetuar o pagamento
            e confirmar seu ticket.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {issuedTickets.map((ticket) => (
            <Card key={ticket.id} data-testid="issued-ticket">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    <Ticket className="size-4 text-primary" /> {ticket.code}
                  </p>
                  <p className="mt-1 text-sm">{ticket.tour?.title}</p>
                  <p className="text-sm capitalize text-muted-foreground">
                    {formatDate(ticket.departure?.date)} · {ticket.quantity} pessoa(s) ·{' '}
                    {formatPrice(ticket.total)}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{ticket.agency?.name}</p>
                  {ticket.agency?.whatsapp && (
                    <a
                      className="text-primary hover:underline"
                      href={`https://wa.me/${ticket.agency.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Comprei o ticket ${ticket.code} pelo RoteiroJá e quero combinar o pagamento.`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Chamar no WhatsApp
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/">Continuar explorando</Link>
          </Button>
          <Button asChild>
            <Link to="/minhas-viagens">Ver minhas viagens</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <p className="py-20 text-center text-muted-foreground">Carregando seu pacote...</p>;
  }

  const items = [...(cart?.items ?? [])].sort(
    (a, b) => new Date(a.departure?.date) - new Date(b.departure?.date),
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingCart className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Seu pacote está vazio</h1>
        <p className="mt-2 text-muted-foreground">
          Explore os passeios de Jaguariaíva e monte seu roteiro dia a dia.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/">Ver passeios</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Meu pacote</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Um passeio por dia — ao fechar, você recebe um ticket por passeio para pagar direto com a
        agência.
      </p>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <Card key={item.id} data-testid="cart-item">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium capitalize text-primary">
                  <CalendarDays className="size-4" />
                  {formatDate(item.departure?.date)} · {formatTime(item.departure?.date)}
                </p>
                <p className="mt-1 font-semibold">{item.departure?.tour?.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.departure?.tour?.agency?.name} · {item.quantity} pessoa(s) ×{' '}
                  {formatPrice(item.unitPrice)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">{formatPrice(item.subtotal)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover item"
                  onClick={() => removeMutation.mutate(item.id)}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Total do pacote</CardTitle>
          <span className="text-2xl font-bold text-primary" data-testid="cart-total">
            {formatPrice(cart.total)}
          </span>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            size="lg"
            onClick={() => closeMutation.mutate()}
            disabled={closeMutation.isPending}
          >
            {closeMutation.isPending ? 'Fechando pacote...' : 'Fechar pacote e gerar tickets'}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            As vagas são reservadas na hora. O pagamento é combinado diretamente com cada agência.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
