import { api } from './api.js';

export function listTours({ q, agency, difficulty } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (agency) params.set('agency', agency);
  if (difficulty) params.set('difficulty', difficulty);
  const query = params.toString();
  return api.get(`/tours${query ? `?${query}` : ''}`);
}

export function getTour(id) {
  return api.get(`/tours/${id}`);
}

export function createTour(payload) {
  return api.post('/tours', payload);
}

export function updateTour(id, payload) {
  return api.put(`/tours/${id}`, payload);
}

export function deleteTour(id) {
  return api.delete(`/tours/${id}`);
}

export function createDeparture(tourId, payload) {
  return api.post(`/tours/${tourId}/departures`, payload);
}

export function updateDeparture(id, payload) {
  return api.put(`/departures/${id}`, payload);
}

export function deleteDeparture(id) {
  return api.delete(`/departures/${id}`);
}
