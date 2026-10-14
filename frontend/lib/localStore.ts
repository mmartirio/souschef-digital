import { localDb, OutboxAction, readFavoriteIds, readRecipe, readRecipes } from './localDb';
import type { Category, CountryCount, Difficulty, Recipe, RecipeInput } from './types';

/**
 * Leituras e gravações do app, sempre no banco local (SQLite). Cada gravação entra na fila
 * de envio ao servidor; `lib/sync.ts` a envia assim que houver conexão.
 */

type Listener = () => void;
const listeners = new Set<Listener>();

/** Avisa as telas quando os dados locais mudam (gravação ou sincronização). */
export function onLocalChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const notifyLocalChange = () => listeners.forEach((listener) => listener());

let requestSync: () => void = () => undefined;
/** Registrado pelo `sync.ts`: dispara um envio após cada gravação local. */
export const setSyncTrigger = (trigger: () => void) => {
  requestSync = trigger;
};

async function enqueue(action: OutboxAction, recipeId: number, payload?: object) {
  await (await localDb()).runAsync(
    'INSERT INTO outbox (action, recipe_id, payload) VALUES (?, ?, ?)',
    action,
    recipeId,
    payload ? JSON.stringify(payload) : null,
  );
}

async function writeRecipe(recipe: Recipe) {
  await (await localDb()).runAsync(
    'INSERT OR REPLACE INTO recipes (id, data) VALUES (?, ?)',
    recipe.id,
    JSON.stringify(recipe),
  );
}

/** Depois de gravar: atualiza as telas e tenta enviar ao servidor. */
function afterWrite() {
  notifyLocalChange();
  requestSync();
}

const now = () => new Date().toISOString();
const plain = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Receitas novas primeiro (as criadas no celular, com id temporário negativo, e depois as mais recentes). */
const newestFirst = (a: Recipe, b: Recipe) => (a.id < 0 || b.id < 0 ? a.id - b.id : b.id - a.id);

export interface RecipeFilters {
  search?: string;
  difficulty?: Difficulty | null;
  country?: string | null;
}

const CATEGORIES: Omit<Category, 'recipe_count'>[] = [
  { id: 1, name: 'Fáceis', description: 'Receitas rápidas e simples', difficulty: 'easy' },
  { id: 2, name: 'Médias', description: 'Receitas de dificuldade intermediária', difficulty: 'medium' },
  { id: 3, name: 'Difíceis', description: 'Receitas complexas e elaboradas', difficulty: 'hard' },
];

export const localRecipes = {
  list: async ({ search, difficulty, country }: RecipeFilters = {}) => {
    const term = search ? plain(search.trim()) : '';
    return (await readRecipes())
      .filter((r) => !difficulty || r.difficulty === difficulty)
      .filter((r) => !country || r.country === country)
      .filter((r) => !term || plain(`${r.title} ${r.description ?? ''}`).includes(term))
      .sort(newestFirst);
  },

  get: readRecipe,

  countries: async (): Promise<CountryCount[]> => {
    const counts = new Map<string, number>();
    for (const { country } of await readRecipes()) {
      if (country) counts.set(country, (counts.get(country) ?? 0) + 1);
    }
    return [...counts]
      .map(([name, recipe_count]) => ({ country: name, recipe_count }))
      .sort((a, b) => b.recipe_count - a.recipe_count || a.country.localeCompare(b.country));
  },

  categories: async (): Promise<Category[]> => {
    const recipes = await readRecipes();
    return CATEGORIES.map((c) => ({ ...c, recipe_count: recipes.filter((r) => r.difficulty === c.difficulty).length }));
  },

  /** Cria no celular com id temporário (negativo); o servidor dá o id definitivo ao sincronizar. */
  create: async (input: RecipeInput, userId: number): Promise<Recipe> => {
    const id = -Date.now();
    const recipe: Recipe = { ...input, id, user_id: userId, from_book: false, created_at: now(), updated_at: now() };
    await writeRecipe(recipe);
    await enqueue('create', id, { ...input, client_ref: `app-${userId}${id}`, client_updated_at: recipe.updated_at });
    afterWrite();
    return recipe;
  },

  update: async (id: number, input: RecipeInput): Promise<Recipe> => {
    const current = await readRecipe(id);
    if (!current) throw new Error('Receita não encontrada');
    const recipe: Recipe = { ...current, ...input, updated_at: now() };
    await writeRecipe(recipe);
    await enqueue('update', id, { ...input, client_updated_at: recipe.updated_at });
    afterWrite();
    return recipe;
  },

  remove: async (id: number) => {
    const db = await localDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM recipes WHERE id = ?', id);
      await db.runAsync('DELETE FROM favorites WHERE recipe_id = ?', id);
      if (id < 0) {
        // Ainda não chegou ao servidor: basta descartar o que estava na fila.
        await db.runAsync('DELETE FROM outbox WHERE recipe_id = ?', id);
      } else {
        await enqueue('delete', id);
      }
    });
    afterWrite();
  },
};

export const localFavorites = {
  ids: readFavoriteIds,

  list: async () => {
    const ids = await readFavoriteIds();
    return (await readRecipes()).filter((r) => ids.has(r.id)).sort(newestFirst);
  },

  set: async (recipeId: number, favorite: boolean) => {
    const db = await localDb();
    await db.runAsync(
      favorite ? 'INSERT OR IGNORE INTO favorites (recipe_id) VALUES (?)' : 'DELETE FROM favorites WHERE recipe_id = ?',
      recipeId,
    );
    await enqueue(favorite ? 'favorite' : 'unfavorite', recipeId);
    afterWrite();
  },
};
