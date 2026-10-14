// Espelho dos contratos em backend/app/schemas.py

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Role = 'user' | 'assistant';

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

export interface UserUpdate {
  full_name?: string;
  current_password?: string;
  new_password?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Ingredient {
  id?: number;
  name: string;
  quantity: string | null;
}

export interface RecipeInput {
  title: string;
  description?: string | null;
  instructions: string;
  prep_time?: number | null;
  cook_time?: number | null;
  servings?: number | null;
  difficulty?: Difficulty | null;
  /** País de criação do prato. */
  country?: string | null;
  ingredients: Ingredient[];
}

export interface Recipe extends RecipeInput {
  id: number;
  user_id: number;
  /** Receita do livro inicial: qualquer usuário logado pode editar. */
  from_book: boolean;
  created_at: string | null;
  /** Última alteração (define a versão que vale em conflitos de sincronização). */
  updated_at: string | null;
}

export type Phase = 'Preparo' | 'Cocção' | 'Descanso';

export interface RecipePhase {
  name: Phase;
  steps: string[];
}

/** Um componente da receita (ex.: massa, recheio, cobertura) ou o preparo final (montagem). */
export interface RecipeStage {
  title: string;
  final: boolean;
  /** Mise en place deste componente. */
  ingredients: Ingredient[];
  phases: RecipePhase[];
}

/** Tudo que o celular guarda no banco local (espelho de SyncSnapshot). */
export interface SyncSnapshot {
  server_time: string;
  recipes: Recipe[];
  favorite_ids: number[];
}

export interface Category {
  id: number;
  name: string;
  description: string;
  difficulty: Difficulty;
  recipe_count: number;
}

export interface CountryCount {
  country: string;
  recipe_count: number;
}

export interface ChatMessage {
  role: Role;
  content: string;
}

/** Receita encontrada no livro de receitas a partir de um pedido falado. */
export interface RecipeMatch {
  id: number;
  title: string;
}

export interface RecipeSearch {
  match: RecipeMatch | null;
  /** Sugestões quando o pedido é ambíguo. */
  options: RecipeMatch[];
}

export interface Transcription {
  text: string;
  language: string;
  duration: number;
}

export interface AIHealth {
  ollama: boolean;
  model: string;
  transcription: boolean;
}
