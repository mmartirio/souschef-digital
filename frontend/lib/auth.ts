import { createContext, createElement, ReactNode, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { isAxiosError } from 'axios';
import { authAPI, TOKEN_KEY } from './api';
import { clearLocalData } from './localDb';
import { startSync } from './sync';
import type { AuthResponse, User } from './types';

// Token e último usuário ficam no SecureStore (Android Keystore), nunca em texto puro.
const USER_KEY = 'auth_user'; // último usuário logado: permite abrir o app sem conexão

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  /** Atualiza o usuário em memória após editar o perfil. */
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const isUnauthorized = (error: unknown) => isAxiosError(error) && error.response?.status === 401;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setUser = (next: User | null) => {
    setUserState(next);
    void (next ? SecureStore.setItemAsync(USER_KEY, JSON.stringify(next)) : SecureStore.deleteItemAsync(USER_KEY));
  };

  const endSession = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await clearLocalData(); // dados locais pertencem ao usuário que saiu
    setUser(null);
  };

  useEffect(() => {
    // Restaura a sessão: sem conexão, usa o último usuário salvo; só um 401 encerra a sessão.
    (async () => {
      const [token, saved] = await Promise.all([SecureStore.getItemAsync(TOKEN_KEY), SecureStore.getItemAsync(USER_KEY)]);
      if (!token) return;
      if (saved) setUserState(JSON.parse(saved) as User);
      try {
        setUser(await authAPI.me());
      } catch (error) {
        if (isUnauthorized(error)) await endSession();
      }
    })().finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Banco local ↔ servidor: sincroniza enquanto há alguém logado.
  useEffect(() => (user ? startSync() : undefined), [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const startSession = async ({ access_token, user: next }: AuthResponse) => {
    const previous = await SecureStore.getItemAsync(USER_KEY);
    if (!previous || (JSON.parse(previous) as User).id !== next.id) await clearLocalData();
    await SecureStore.setItemAsync(TOKEN_KEY, access_token);
    setUser(next);
  };

  const value: AuthState = {
    user,
    loading,
    login: async (email, password) => startSession(await authAPI.login(email, password)),
    register: async (email, password, fullName) => startSession(await authAPI.register(email, password, fullName)),
    loginWithGoogle: async (idToken) => startSession(await authAPI.google(idToken)),
    setUser,
    logout: endSession,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return context;
}
