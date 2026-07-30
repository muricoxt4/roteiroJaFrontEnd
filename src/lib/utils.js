import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatPrice(value) {
  return BRL.format(value ?? 0);
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

export const DIFFICULTY_LABELS = {
  FACIL: 'Fácil',
  MODERADA: 'Moderada',
  DIFICIL: 'Difícil',
};

export const TICKET_STATUS_LABELS = {
  PENDING: 'Aguardando pagamento',
  CONFIRMED: 'Confirmado',
  USED: 'Utilizado',
  CANCELLED: 'Cancelado',
};
