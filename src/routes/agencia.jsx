import { useState } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CalendarPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { session } from '@/services/api.js';
import {
  createDeparture,
  createTour,
  deleteDeparture,
  deleteTour,
  getTour,
  listTours,
  updateTour,
} from '@/services/tours.js';
import { listTickets, updateTicketStatus } from '@/services/tickets.js';
import {
  formatDate,
  formatTime,
  formatPrice,
  DIFFICULTY_LABELS,
  TICKET_STATUS_LABELS,
} from '@/lib/utils';

export const Route = createFileRoute('/agencia')({
  beforeLoad: () => {
    const user = session.getUser();
    if (!session.getToken()) throw redirect({ to: '/login' });
    if (user?.role !== 'AGENCY') throw redirect({ to: '/' });
  },
  component: AgencyPanel,
});

const tourFormSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(140),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres').max(4000),
  location: z.string().max(200).optional(),
  durationHours: z.coerce.number().min(0.5, 'Mínimo de 0,5h').max(72),
  price: z.coerce.number().min(0, 'Preço não pode ser negativo'),
  difficulty: z.enum(['FACIL', 'MODERADA', 'DIFICIL']),
  includes: z.string().optional(),
  imageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

function TourFormDialog({ open, onOpenChange, tour }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(tour);

  const form = useForm({
    resolver: zodResolver(tourFormSchema),
    values: {
      title: tour?.title ?? '',
      description: tour?.description ?? '',
      location: tour?.location ?? '',
      durationHours: tour?.durationHours ?? 2,
      price: tour?.price ?? 0,
      difficulty: tour?.difficulty ?? 'MODERADA',
      includes: tour?.includes?.join(', ') ?? '',
      imageUrl: tour?.imageUrl ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values) => {
      const payload = {
        ...values,
        includes: values.includes
          ? values.includes.split(',').map((i) => i.trim()).filter(Boolean)
          : [],
      };
      return isEdit ? updateTour(tour.id, payload) : createTour(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      toast.success(isEdit ? 'Passeio atualizado!' : 'Passeio criado!');
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => toast.error(error.message),
  });

  const { errors } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar passeio' : 'Novo passeio'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...form.register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" rows={4} {...form.register('description')} />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="durationHours">Duração (horas)</Label>
              <Input id="durationHours" type="number" step="0.5" {...form.register('durationHours')} />
              {errors.durationHours && (
                <p className="text-sm text-destructive">{errors.durationHours.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Preço por pessoa (R$)</Label>
              <Input id="price" type="number" step="0.01" {...form.register('price')} />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="difficulty">Dificuldade</Label>
              <select
                id="difficulty"
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none"
                {...form.register('difficulty')}
              >
                <option value="FACIL">Fácil</option>
                <option value="MODERADA">Moderada</option>
                <option value="DIFICIL">Difícil</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Local</Label>
              <Input id="location" {...form.register('location')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="includes">O que inclui (separado por vírgula)</Label>
            <Input id="includes" placeholder="Guia, Transporte, Seguro" {...form.register('includes')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="imageUrl">URL da imagem (opcional)</Label>
            <Input id="imageUrl" placeholder="https://..." {...form.register('imageUrl')} />
            {errors.imageUrl && (
              <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeparturesDialog({ open, onOpenChange, tourId }) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [seats, setSeats] = useState(10);

  const { data: tour } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => getTour(tourId),
    enabled: open && Boolean(tourId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tour', tourId] });
    queryClient.invalidateQueries({ queryKey: ['tours'] });
  };

  const addMutation = useMutation({
    mutationFn: () =>
      createDeparture(tourId, { date: new Date(date).toISOString(), totalSeats: Number(seats) }),
    onSuccess: () => {
      invalidate();
      setDate('');
      toast.success('Saída criada!');
    },
    onError: (error) => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: deleteDeparture,
    onSuccess: () => {
      invalidate();
      toast.success('Saída removida.');
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Datas de saída — {tour?.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="dep-date">Data e hora</Label>
            <Input
              id="dep-date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="w-24 space-y-1.5">
            <Label htmlFor="dep-seats">Vagas</Label>
            <Input
              id="dep-seats"
              type="number"
              min={1}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
            />
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={!date || addMutation.isPending}>
            <CalendarPlus /> Adicionar
          </Button>
        </div>

        <ul className="divide-y">
          {tour?.departures?.length === 0 && (
            <p className="py-3 text-sm text-muted-foreground">Nenhuma saída futura.</p>
          )}
          {tour?.departures?.map((departure) => (
            <li key={departure.id} className="flex items-center justify-between gap-2 py-2">
              <div className="text-sm">
                <p className="font-medium capitalize">
                  {formatDate(departure.date)} · {formatTime(departure.date)}
                </p>
                <p className="text-muted-foreground">
                  {departure.availableSeats}/{departure.totalSeats} vagas disponíveis
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remover saída"
                onClick={() => removeMutation.mutate(departure.id)}
                disabled={removeMutation.isPending}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_VARIANTS = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  USED: 'secondary',
  CANCELLED: 'destructive',
};

function AgencyPanel() {
  const user = session.getUser();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [departuresTourId, setDeparturesTourId] = useState(null);

  const { data: tours } = useQuery({
    queryKey: ['tours', { agency: user.agency }],
    queryFn: () => listTours({ agency: user.agency }),
  });

  const { data: tickets } = useQuery({ queryKey: ['tickets'], queryFn: listTickets });

  const deleteMutation = useMutation({
    mutationFn: deleteTour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      toast.success('Passeio removido do catálogo.');
    },
    onError: (error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Status do ticket atualizado!');
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Painel da agência</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus passeios, datas e tickets.</p>
        </div>
        <Button
          onClick={() => {
            setEditingTour(null);
            setFormOpen(true);
          }}
        >
          <Plus /> Novo passeio
        </Button>
      </div>

      {/* Passeios */}
      <Card>
        <CardHeader>
          <CardTitle>Meus passeios</CardTitle>
        </CardHeader>
        <CardContent>
          {tours?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum passeio cadastrado ainda.</p>
          )}
          <ul className="divide-y">
            {tours?.map((tour) => (
              <li
                key={tour.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
                data-testid="agency-tour-row"
              >
                <div className="min-w-0">
                  <p className="font-medium">{tour.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(tour.price)} · {tour.durationHours}h ·{' '}
                    {DIFFICULTY_LABELS[tour.difficulty]}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeparturesTourId(tour.id)}
                  >
                    <CalendarPlus /> Datas
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar passeio"
                    onClick={() => {
                      setEditingTour(tour);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir passeio"
                    onClick={() => {
                      if (window.confirm(`Remover "${tour.title}" do catálogo?`)) {
                        deleteMutation.mutate(tour.id);
                      }
                    }}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets recebidos</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum ticket ainda.</p>
          )}
          <ul className="divide-y">
            {tickets?.map((ticket) => (
              <li
                key={ticket.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
                data-testid="agency-ticket-row"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold">{ticket.code}</p>
                  <p className="text-sm">
                    {ticket.tour?.title} · {ticket.quantity} pessoa(s) ·{' '}
                    {formatPrice(ticket.total)}
                  </p>
                  <p className="text-sm capitalize text-muted-foreground">
                    {formatDate(ticket.departure?.date)} · {ticket.holder?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANTS[ticket.status]}>
                    {TICKET_STATUS_LABELS[ticket.status]}
                  </Badge>
                  {ticket.status === 'PENDING' && (
                    <Button
                      size="sm"
                      onClick={() => statusMutation.mutate({ id: ticket.id, status: 'CONFIRMED' })}
                      disabled={statusMutation.isPending}
                    >
                      Confirmar pagamento
                    </Button>
                  )}
                  {ticket.status === 'CONFIRMED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => statusMutation.mutate({ id: ticket.id, status: 'USED' })}
                      disabled={statusMutation.isPending}
                    >
                      Marcar utilizado
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <TourFormDialog open={formOpen} onOpenChange={setFormOpen} tour={editingTour} />
      <DeparturesDialog
        open={Boolean(departuresTourId)}
        onOpenChange={(open) => !open && setDeparturesTourId(null)}
        tourId={departuresTourId}
      />
    </div>
  );
}
