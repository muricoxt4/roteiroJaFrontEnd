// Cliente HTTP central — ÚNICO ponto do front que fala com a API REST.
// Todos os serviços de domínio usam este módulo. Base URL vem de VITE_API_URL.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const TOKEN_KEY = 'roteiroja_token';
const USER_KEY = 'roteiroja_user';

export const session = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  set(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

/** Erro de API com status HTTP e código estável (para toasts e decisões do front). */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function rawRequest(method, path, body) {
  const token = session.getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Token expirado/inválido: encerra a sessão local.
  if (res.status === 401 && token) {
    session.clear();
  }

  if (res.status === 204) return null;

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* resposta sem corpo JSON */
  }

  if (!res.ok || payload?.success === false) {
    const err = payload?.error;
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN_ERROR',
      err?.message ?? `Erro HTTP ${res.status}`,
      err?.details,
    );
  }

  return payload?.data ?? payload;
}

export const api = {
  get: (path) => rawRequest('GET', path),
  post: (path, body) => rawRequest('POST', path, body),
  put: (path, body) => rawRequest('PUT', path, body),
  patch: (path, body) => rawRequest('PATCH', path, body),
  delete: (path) => rawRequest('DELETE', path),
};
