import { api } from './api.js';

export function listTickets() {
  return api.get('/tickets');
}

export function updateTicketStatus(id, status) {
  return api.patch(`/tickets/${id}/status`, { status });
}
