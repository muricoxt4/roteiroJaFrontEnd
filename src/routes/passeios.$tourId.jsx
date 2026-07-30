import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, CalendarDays, Check, Clock, MapPin, Mountain, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getTour } from '@/services/tours.js';
import { addCartItem } from '@/services/packages.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { formatDate, formatTime, formatPrice, DIFFICULTY_LABELS } from '@/lib/utils';

export const Route = createFileRoute('/passeios/$tourId')({
  component: TourDetailPage,
});

const DIFFICULTY_VARIANTS = { FACIL: 'success', MODERADA: 'warning', DIFICIL: 'destructive' };

function TourDetailPage() {
  const { tourId } = Route.useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);

  const { data: tour, isLoading } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => getTour(tourId),
  });

  const addMutation = useMutation({
    mutationFn: (departureId) => addCartItem({ departureId, quantity: Number(quantity) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Passeio adicionado ao seu pacote!');
    },
    onError: (error) => toast.error(error.message),
  });

  const handleAdd = (departureId) => {
    if (!isAuthenticated) {
      toast.info('Entre na sua conta para montar seu pacote.');
      navigate({ to: '/login' });
      return;
    }
    addMutation.mutate(departureId);
  };

  if (isLoading) {
    return <p className="py-20 text-center text-muted-foreground">Carregando passeio...</p>;
  }
  if (!tour) {
    return <p className="py-20 text-center text-destructive">Passeio não encontrado.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Capa */}
      <div className="flex h-52 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-primary/40">
        {tour.imageUrl ? (
          <img
            src={tour.imageUrl}
            alt={tour.title}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          <Mountain className="size-16 text-primary-foreground/70" />
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{tour.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="size-4" /> {tour.agency?.name}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-4" /> {tour.durationHours}h de duração
            </span>
            {tour.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-4" /> {tour.location}
              </span>
            )}
            <Badge variant={DIFFICULTY_VARIANTS[tour.difficulty]}>
              {DIFFICULTY_LABELS[tour.difficulty]}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary">{formatPrice(tour.price)}</p>
          <p className="text-xs text-muted-foreground">por pessoa</p>
        </div>
      </div>

      <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/90">
        {tour.description}
      </p>

      {tour.includes?.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">O que está incluído</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {tour.includes.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-primary" /> {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Saídas programadas */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4" /> Datas disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="quantity">Pessoas:</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-20"
            />
          </div>

          {tour.departures?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma data programada no momento. Volte em breve!
            </p>
          )}

          <ul className="divide-y">
            {tour.departures?.map((departure) => (
              <li
                key={departure.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
                data-testid="departure-row"
              >
                <div>
                  <p className="font-medium capitalize">{formatDate(departure.date)}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="size-3.5" /> {formatTime(departure.date)} ·{' '}
                    <Users className="size-3.5" />
                    {departure.soldOut
                      ? 'Esgotado'
                      : `${departure.availableSeats} vagas restantes`}
                  </p>
                </div>
                {departure.soldOut ? (
                  <Badge variant="destructive">Esgotado</Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleAdd(departure.id)}
                    disabled={addMutation.isPending}
                  >
                    Adicionar ao pacote
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
