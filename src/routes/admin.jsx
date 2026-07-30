import { useState } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
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
  createAgency,
  createAgencyUser,
  deleteAgency,
  listAgencies,
  updateAgency,
} from '@/services/agencies.js';

export const Route = createFileRoute('/admin')({
  beforeLoad: () => {
    const user = session.getUser();
    if (!session.getToken()) throw redirect({ to: '/login' });
    if (user?.role !== 'ADMIN') throw redirect({ to: '/' });
  },
  component: AdminPanel,
});

const agencySchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(120),
  description: z.string().max(2000).optional(),
  whatsapp: z.string().max(20).optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
});

const agencyUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(80),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

function AgencyFormDialog({ open, onOpenChange, agency }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(agency);

  const form = useForm({
    resolver: zodResolver(agencySchema),
    values: {
      name: agency?.name ?? '',
      description: agency?.description ?? '',
      whatsapp: agency?.whatsapp ?? '',
      email: agency?.email ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values) => (isEdit ? updateAgency(agency.id, values) : createAgency(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      toast.success(isEdit ? 'Agência atualizada!' : 'Agência criada!');
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
          <DialogTitle>{isEdit ? 'Editar agência' : 'Nova agência'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="ag-name">Nome</Label>
            <Input id="ag-name" {...form.register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ag-description">Descrição</Label>
            <Textarea id="ag-description" rows={3} {...form.register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ag-whatsapp">WhatsApp</Label>
              <Input id="ag-whatsapp" placeholder="+55 43 9..." {...form.register('whatsapp')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ag-email">E-mail</Label>
              <Input id="ag-email" type="email" {...form.register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
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

function AgencyUserDialog({ open, onOpenChange, agency }) {
  const form = useForm({
    resolver: zodResolver(agencyUserSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values) => createAgencyUser(agency.id, values),
    onSuccess: (user) => {
      toast.success(`Acesso criado para ${user.email}`);
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
          <DialogTitle>Criar acesso — {agency?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="au-name">Nome do operador</Label>
            <Input id="au-name" {...form.register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="au-email">E-mail de login</Label>
            <Input id="au-email" type="email" {...form.register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="au-password">Senha</Label>
            <Input id="au-password" type="password" {...form.register('password')} />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Criando...' : 'Criar acesso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdminPanel() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);
  const [userDialogAgency, setUserDialogAgency] = useState(null);

  const { data: agencies } = useQuery({ queryKey: ['agencies'], queryFn: listAgencies });

  const deleteMutation = useMutation({
    mutationFn: deleteAgency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      toast.success('Agência desativada (passeios saem do catálogo).');
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Administração</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as agências parceiras da plataforma.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingAgency(null);
            setFormOpen(true);
          }}
        >
          <Plus /> Nova agência
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agências parceiras</CardTitle>
        </CardHeader>
        <CardContent>
          {agencies?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma agência cadastrada.</p>
          )}
          <ul className="divide-y">
            {agencies?.map((agency) => (
              <li
                key={agency.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
                data-testid="admin-agency-row"
              >
                <div className="min-w-0">
                  <p className="font-medium">{agency.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {agency.whatsapp || 'sem WhatsApp'} · {agency.email || 'sem e-mail'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserDialogAgency(agency)}
                  >
                    <KeyRound /> Criar acesso
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar agência"
                    onClick={() => {
                      setEditingAgency(agency);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Desativar agência"
                    onClick={() => {
                      if (window.confirm(`Desativar "${agency.name}" e seus passeios?`)) {
                        deleteMutation.mutate(agency.id);
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

      <AgencyFormDialog open={formOpen} onOpenChange={setFormOpen} agency={editingAgency} />
      <AgencyUserDialog
        open={Boolean(userDialogAgency)}
        onOpenChange={(open) => !open && setUserDialogAgency(null)}
        agency={userDialogAgency}
      />
    </div>
  );
}
