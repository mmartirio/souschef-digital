import { useCallback } from 'react';
import { localFavorites } from '../lib/localStore';
import { useLocalData } from './useLocalData';

/** IDs das receitas favoritas (banco local); marcar/desmarcar funciona sem conexão. */
export function useFavorites() {
  const { data } = useLocalData(localFavorites.ids, []);
  const ids = data ?? new Set<number>();

  const toggle = useCallback((recipeId: number) => localFavorites.set(recipeId, !ids.has(recipeId)), [ids]);

  return { ids, toggle };
}
