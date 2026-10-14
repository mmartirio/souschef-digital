import axios, { isAxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_URL } from './constants';
import type {
  AIHealth,
  AuthResponse,
  ChatMessage,
  Recipe,
  RecipeInput,
  RecipeSearch,
  SyncSnapshot,
  Transcription,
  User,
  UserUpdate,
} from './types';

export const TOKEN_KEY = 'auth_token';
const AI_TIMEOUT = 120_000;

const client = axios.create({ baseURL: API_URL, timeout: 15_000 });

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Mensagem legível a partir de erros da API. */
export function errorMessage(error: unknown, fallback = 'Erro ao conectar com o servidor'): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join('\n');
    return fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export const authAPI = {
  login: async (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password }).toString();
    const { data } = await client.post<AuthResponse>('/auth/login', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  },
  register: async (email: string, password: string, fullName: string) =>
    (await client.post<AuthResponse>('/auth/register', { email, password, full_name: fullName })).data,
  google: async (idToken: string) =>
    (await client.post<AuthResponse>('/auth/google', { id_token: idToken })).data,
  me: async () => (await client.get<User>('/auth/me')).data,
};

/**
 * Chamadas usadas só pela sincronização (lib/sync.ts). As telas leem e gravam no banco
 * local (lib/localStore.ts), nunca direto no servidor.
 */
export const syncAPI = {
  snapshot: async () => (await client.get<SyncSnapshot>('/recipes/sync')).data,
  createRecipe: async (recipe: RecipeInput & { client_ref: string; client_updated_at: string }) =>
    (await client.post<Recipe>('/recipes/', recipe)).data,
  updateRecipe: async (id: number, recipe: RecipeInput & { client_updated_at: string }) =>
    (await client.put<Recipe>(`/recipes/${id}`, recipe)).data,
  deleteRecipe: async (id: number) => {
    await client.delete(`/recipes/${id}`);
  },
  addFavorite: async (recipeId: number) => {
    await client.post('/favorites/', { recipe_id: recipeId });
  },
  removeFavorite: async (recipeId: number) => {
    await client.delete(`/favorites/${recipeId}`);
  },
};

/** URL absoluta para arquivos servidos pelo backend (ex.: /media/avatar.jpg). */
export const mediaUrl = (path: string | null) => (path ? `${API_URL}${path}` : null);

async function fileFormData(uri: string, name: string, type: string): Promise<FormData> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    form.append('file', await (await fetch(uri)).blob(), name);
  } else {
    form.append('file', { uri, name, type } as unknown as Blob);
  }
  return form;
}

export const usersAPI = {
  update: async (data: UserUpdate) => (await client.put<User>('/users/me', data)).data,
  uploadAvatar: async (uri: string, mimeType = 'image/jpeg') => {
    const name = `avatar.${mimeType.split('/')[1] ?? 'jpg'}`;
    return (
      await client.put<User>('/users/me/avatar', await fileFormData(uri, name, mimeType), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data;
  },
  deleteMe: async () => {
    await client.delete('/users/me');
  },
};

async function audioFormData(uri: string): Promise<FormData> {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  const name = `voice.${ext && ext.length <= 4 ? ext : Platform.OS === 'web' ? 'webm' : 'm4a'}`;
  return fileFormData(uri, name, 'audio/mp4');
}

export const aiAPI = {
  chat: async (messages: ChatMessage[], recipeId?: number) =>
    (
      await client.post<{ response: string }>(
        '/ai/chat',
        { messages, recipe_id: recipeId },
        { timeout: AI_TIMEOUT },
      )
    ).data.response,
  transcribe: async (uri: string) =>
    (
      await client.post<Transcription>('/ai/transcribe', await audioFormData(uri), {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: AI_TIMEOUT,
      })
    ).data.text,
  findRecipe: async (request: string) =>
    (await client.get<RecipeSearch>('/ai/find-recipe', { params: { q: request } })).data,
  health: async () => (await client.get<AIHealth>('/ai/health')).data,
};
