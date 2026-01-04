import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  Recipe,
  Category,
  Favorite,
  ChatMessage,
  AuthResponse,
  ApiError,
} from './types';

const API_URL = 'http://localhost:8000';

// Criar instância do Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor para adicionar token nas requisições
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data.access_token) {
      await AsyncStorage.setItem('auth_token', response.data.access_token);
    }
    return response.data;
  },

  register: async (
    name: string,
    email: string,
    password: string
  ): Promise<User> => {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('auth_token');
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// ============ RECIPES ============
export const recipesAPI = {
  list: async (
    skip: number = 0,
    limit: number = 10,
    search?: string,
    difficulty?: string
  ): Promise<Recipe[]> => {
    const params = {
      skip,
      limit,
      ...(search && { search }),
      ...(difficulty && { difficulty }),
    };
    const response = await apiClient.get('/recipes', { params });
    return response.data;
  },

  get: async (id: number): Promise<Recipe> => {
    const response = await apiClient.get(`/recipes/${id}`);
    return response.data;
  },

  create: async (recipe: Partial<Recipe>): Promise<Recipe> => {
    const response = await apiClient.post('/recipes', recipe);
    return response.data;
  },

  update: async (id: number, recipe: Partial<Recipe>): Promise<Recipe> => {
    const response = await apiClient.put(`/recipes/${id}`, recipe);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/recipes/${id}`);
  },

  search: async (query: string): Promise<Recipe[]> => {
    const response = await apiClient.get('/recipes', {
      params: { search: query },
    });
    return response.data;
  },
};

// ============ CATEGORIES ============
export const categoriesAPI = {
  list: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  get: async (id: number): Promise<Category> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  getRecipes: async (categoryId: number): Promise<Recipe[]> => {
    const response = await apiClient.get(`/categories/${categoryId}/recipes`);
    return response.data;
  },
};

// ============ FAVORITES ============
export const favoritesAPI = {
  list: async (): Promise<Favorite[]> => {
    const response = await apiClient.get('/favorites');
    return response.data;
  },

  add: async (recipeId: number): Promise<Favorite> => {
    const response = await apiClient.post('/favorites', {
      recipe_id: recipeId,
    });
    return response.data;
  },

  remove: async (recipeId: number): Promise<void> => {
    await apiClient.delete(`/favorites/${recipeId}`);
  },

  isFavorite: async (recipeId: number): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/favorites/${recipeId}`);
      return !!response.data;
    } catch {
      return false;
    }
  },
};

// ============ AI CHAT ============
export const aiAPI = {
  chat: async (message: string): Promise<string> => {
    const response = await apiClient.post('/ai/chat', { message });
    return response.data.response;
  },

  listModels: async (): Promise<string[]> => {
    const response = await apiClient.get('/ai/models');
    return response.data.models;
  },

  getHealth: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/ai/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  },
};

// ============ USERS ============
export const usersAPI = {
  getProfile: async (userId: number): Promise<User> => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  updateProfile: async (userId: number, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/users/${userId}`, data);
    return response.data;
  },

  getRecipes: async (userId: number): Promise<Recipe[]> => {
    const response = await apiClient.get(`/users/${userId}/recipes`);
    return response.data;
  },
};

// ============ HEALTH CHECK ============
export const healthAPI = {
  check: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  },
};

export default apiClient;
