import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Compass, LogOut, ShoppingCart, TicketCheck, Building2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { getCart } from '@/services/packages.js';

export function Navbar() {
  const { user, isAuthenticated, isAdmin, isAgency, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: isAuthenticated,
  });
  const cartCount = cart?.items?.length ?? 0;

  const handleSignOut = () => {
    signOut();
    navigate({ to: '/' });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
        <Link to="/" className="flex items-center gap-2 font-bold text-primary">
          <Compass className="size-6" />
          <span className="text-lg">RoteiroJá</span>
          <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
            Jaguariaíva-PR
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Passeios</Link>
          </Button>

          {isAuthenticated && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/minhas-viagens">
                <TicketCheck />
                <span className="hidden sm:inline">Minhas viagens</span>
              </Link>
            </Button>
          )}

          {isAgency && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/agencia">
                <Building2 />
                <span className="hidden sm:inline">Painel da agência</span>
              </Link>
            </Button>
          )}

          {isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin">
                <ShieldCheck />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </Button>
          )}

          {isAuthenticated ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/carrinho" aria-label="Meu pacote">
                  <ShoppingCart />
                  <span className="hidden sm:inline">Meu pacote</span>
                  {cartCount > 0 && <Badge className="ml-1">{cartCount}</Badge>}
                </Link>
              </Button>
              <span className="hidden max-w-28 truncate text-sm text-muted-foreground md:inline">
                {user.name}
              </span>
              <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sair">
                <LogOut />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/cadastro">Criar conta</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
