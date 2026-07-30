import { createContext, useContext, useMemo, useState } from 'react';
import { session } from '@/services/api.js';
import * as authService from '@/services/auth.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => session.getUser());

  const login = async (credentials) => {
    const logged = await authService.login(credentials);
    setUser(logged);
    return logged;
  };

  const register = async (payload) => {
    const created = await authService.register(payload);
    setUser(created);
    return created;
  };

  const signOut = () => {
    authService.logout();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      isAgency: user?.role === 'AGENCY',
      login,
      register,
      signOut,
    }),
    [user],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
