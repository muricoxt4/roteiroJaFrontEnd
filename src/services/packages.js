import { api } from './api.js';

export function getCart() {
  return api.get('/packages/cart');
}

export function addCartItem(payload) {
  return api.post('/packages/cart/items', payload);
}

export function removeCartItem(itemId) {
  return api.delete(`/packages/cart/items/${itemId}`);
}

export function closeCart() {
  return api.post('/packages/cart/close');
}

export function listPackages() {
  return api.get('/packages');
}
