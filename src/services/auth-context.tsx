import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  clearSessionStorage,
  getStoredUser,
  saveFullSession,
  type StoredUser,
} from '@/api/token-storage';
import { apiFetch } from '@/api/http-client';

interface AuthResponse {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
  usuario: StoredUser;
}

interface AuthContextValue {
  usuario: StoredUser | null;
  cargandoSesion: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrarse: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function autenticarContraEndpoint(
  endpoint: '/api/auth/login' | '/api/auth/registro',
  email: string,
  password: string
): Promise<StoredUser> {
  const res = await apiFetch<AuthResponse>(
    endpoint,
    { method: 'POST', body: JSON.stringify({ email, password }) },
    false
  );
  await saveFullSession(res.token, res.refreshToken, res.usuario);
  return res.usuario;
}

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [usuario, setUsuario] = useState<StoredUser | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    getStoredUser()
      .then(async (localUser) => {
        if (!localUser) return;
        setUsuario(localUser);
        const remoto = await apiFetch<{ usuario: StoredUser }>(
          '/api/auth/yo'
        ).catch(() => null);
        if (remoto?.usuario) setUsuario(remoto.usuario);
      })
      .finally(() => setCargandoSesion(false));
  }, []);

  const iniciarSesion = useCallback(async (email: string, pass: string) => {
    setUsuario(await autenticarContraEndpoint('/api/auth/login', email, pass));
  }, []);

  const registrarse = useCallback(async (email: string, pass: string) => {
    setUsuario(
      await autenticarContraEndpoint('/api/auth/registro', email, pass)
    );
  }, []);

  const cerrarSesion = useCallback(async () => {
    await clearSessionStorage();
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargandoSesion,
        iniciarSesion,
        registrarse,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
