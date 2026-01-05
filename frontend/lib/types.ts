// Type definitions

export interface User {
  id: number;
  email: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  instructions: string;
  prep_time: number;
  cook_time?: number;
  servings: number;
  difficulty: 'facil' | 'medio' | 'dificil';
  image_url?: string;
  ingredients: Ingredient[];
  user_id: number;
  user?: User;
  created_at?: string;
  updated_at?: string;
  is_favorite?: boolean;
}

export interface Ingredient {
  id?: number;
  name: string;
  quantity: string;
  unit: string;
  recipe_id?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  recipe_count?: number;
}

export interface Favorite {
  id: number;
  recipe_id: number;
  user_id: number;
  created_at?: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}
