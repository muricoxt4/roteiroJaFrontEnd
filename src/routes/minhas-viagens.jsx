import { useState } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Ticket as TicketIcon, PackageOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { session } from '@/services/api.js';
import { listTickets, updateTicketStatus } from '@/services/tickets.js';
import { listPackages } from '@/services/packages.js';
import { formatDate, formatPrice, TICKET_STATUS_LABELS } from '@/lib/utils';

export const Route = createFileRoute('/minhas-viagens')({
  beforeLoad: () => {
    if (!session.getToken()) throw redirect({ to: '/login' });
  },
  component: MyTripsPage,
});

const STATUS_VARIANTS = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  USED: 'secondary',
  CANCELLED: 'destructive',
};

function TicketCard({ ticket, onCancel, cancelPending }) {
  const isFuture = ticket.departure?.date && new Date(ticket.departure.date) > new Date();
  const canCancel = ['PENDING', 'CONFIRMED'].includes(ticket.status) && isFuture;

  return (
    <Card data-testid="ticket-card">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex items-center gap-1.5 font-mono font-semibold">
              <TicketIcon className="size-4 text-primary" /> {ticket.code}
            </p>
            <Badge variant={STATUS_VARIANTS[ticket.status]}>
              {TICKET_STATUS_LABELS[ticket.status]}
            </Badge>
          </div>
          <p className="mt-1 font-medium">{ticket.tour?.title}</p>
          <p className="text-sm capitalize text-muted-foreground">
            {formatDate(ticket.departure?.date)} · {ticket.quantity} pessoa(s) ·{' '}
            {formatPrice(ticket.total)}
          </p>
          <p className="text-sm text-muted-foreground">
            {ticket.agency?.name}
            {ticket.agency?.whatsapp && ticket.status === 'PENDING' && (
              <>
                {' · '}
                <a
                  className="text-primary hover:underline"
                  href={`https://wa.me/${ticket.agency.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Tenho o ticket ${ticket.code} do RoteiroJá e quero combinar o pagamento.`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Pagar via WhatsApp
                </a>
              </>
            )}
          </p>
        </div>
        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(ticket.id)}
            disabled={cancelPending}
          >
            Cancelar ticket
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function MyTripsPage() {
  const [tab, setTab] = useState('tickets');
  const queryClient = useQueryClient();

  const { data: tickets, isLoading: loadingTickets } = useQuery({
    queryKey: ['tickets'],
    queryFn: listTickets,
  });
  const { data: packages, isLoading: loadingPackages } = useQuery({
    queryKey: ['packages'],
    queryFn: listPackages,
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => updateTicketStatus(id, 'CANCELLED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket cancelado. As vagas foram liberadas.');
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Minhas viagens</h1>

      <div className="mt-4 flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setTab('tickets')}
          className={`cursor-pointer px-4 py-2 text-sm font-medium ${tab === 'tickets' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
        >
          Meus tickets
        </button>
        <button
          type="button"
          onClick={() => setTab('pacotes')}
          className={`cursor-pointer px-4 py-2 text-sm font-medium ${tab === 'pacotes' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
        >
          Pacotes fechados
        </button>
      </div>

      {tab === 'tickets' && (
        <div className="mt-6 space-y-4">
          {loadingTickets && <p className="text-muted-foreground">Carregando tickets...</p>}
          {tickets?.length === 0 && (
            <p className="text-muted-foreground">
              Você ainda não tem tickets. Monte um pacote e feche a compra!
            </p>
          )}
          {tickets?.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onCancel={(id) => cancelMutation.mutate(id)}
              cancelPending={cancelMutation.isPending}
            />
          ))}
        </div>
      )}

      {tab === 'pacotes' && (
        <div className="mt-6 space-y-4">
          {loadingPackages && <p className="text-muted-foreground">Carregando pacotes...</p>}
          {packages?.length === 0 && (
            <p className="text-muted-foreground">Nenhum pacote fechado ainda.</p>
          )}
          {packages?.map((pkg) => (
            <Card key={pkg.id} data-testid="package-card">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-semibold">
                    <PackageOpen className="size-4 text-primary" />
                    Pacote de {pkg.closedAt ? formatDate(pkg.closedAt) : '—'}
                  </p>
                  <span className="font-bold text-primary">{formatPrice(pkg.total)}</span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {pkg.items.map((item) => (
                    <li key={item.id} className="capitalize">
                      {formatDate(item.departure?.date)} — {item.departure?.tour?.title} (
                      {item.quantity}x)
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
