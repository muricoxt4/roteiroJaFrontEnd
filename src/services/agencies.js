import { api } from './api.js';

export function listAgencies() {
  return api.get('/agencies');
}

export function createAgency(payload) {
  return api.post('/agencies', payload);
}

export function updateAgency(id, payload) {
  return api.put(`/agencies/${id}`, payload);
}

export function deleteAgency(id) {
  return api.delete(`/agencies/${id}`);
}

export function createAgencyUser(agencyId, payload) {
  return api.post(`/agencies/${agencyId}/users`, payload);
}
