import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Mountain, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listTours } from '@/services/tours.js';
import { formatPrice, DIFFICULTY_LABELS } from '@/lib/utils';

export const Route = createFileRoute('/')({
  component: HomePage,
});

const DIFFICULTY_VARIANTS = { FACIL: 'success', MODERADA: 'warning', DIFICIL: 'destructive' };

function TourCard({ tour }) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md" data-testid="tour-card">
      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/80 to-primary/40">
        {tour.imageUrl ? (
          <img src={tour.imageUrl} alt={tour.title} className="h-full w-full object-cover" />
        ) : (
          <Mountain className="size-12 text-primary-foreground/70" />
        )}
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{tour.title}</h3>
          <Badge variant={DIFFICULTY_VARIANTS[tour.difficulty]}>
            {DIFFICULTY_LABELS[tour.difficulty]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{tour.agency?.name}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> {tour.durationHours}h
          </span>
          {tour.location && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{tour.location}</span>
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-lg font-bold text-primary">{formatPrice(tour.price)}</span>
            <span className="text-xs text-muted-foreground"> /pessoa</span>
          </div>
          <Button size="sm" asChild>
            <Link to="/passeios/$tourId" params={{ tourId: tour.id }}>
              Ver passeio
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HomePage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const { data: tours, isLoading, isError } = useQuery({
    queryKey: ['tours', { q: search, difficulty }],
    queryFn: () => listTours({ q: search || undefined, difficulty: difficulty || undefined }),
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/15 to-background">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Monte seu roteiro em <span className="text-primary">Jaguariaíva</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Cânions, cachoeiras, rafting e história — passeios de todas as agências da cidade em um
            só lugar. Escolha os dias, monte o pacote e receba seus tickets.
          </p>

          <div className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar passeio (ex.: cachoeira, rafting...)"
                className="bg-background pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border-input h-9 rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              aria-label="Filtrar por dificuldade"
            >
              <option value="">Todas as dificuldades</option>
              <option value="FACIL">Fácil</option>
              <option value="MODERADA">Moderada</option>
              <option value="DIFICIL">Difícil</option>
            </select>
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        {isLoading && <p className="text-center text-muted-foreground">Carregando passeios...</p>}
        {isError && (
          <p className="text-center text-destructive">
            Não foi possível carregar os passeios. Verifique se a API está no ar.
          </p>
        )}
        {tours?.length === 0 && (
          <p className="text-center text-muted-foreground">Nenhum passeio encontrado.</p>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours?.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </section>
    </div>
  );
}
