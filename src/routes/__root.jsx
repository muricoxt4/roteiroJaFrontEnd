import { Outlet, createRootRoute } from '@tanstack/react-router';
import { Navbar } from '@/components/Navbar.jsx';

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <div className="mx-auto max-w-6xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-2 text-muted-foreground">O endereço acessado não existe.</p>
    </div>
  ),
});

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        RoteiroJá — plataforma de passeios de Jaguariaíva-PR · Projeto acadêmico
      </footer>
    </div>
  );
}
