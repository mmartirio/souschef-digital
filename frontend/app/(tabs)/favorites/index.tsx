import React from 'react';
import RecipeList from '../../../components/recipes/RecipeList';
import { useLocalData } from '../../../hooks/useLocalData';
import { localFavorites } from '../../../lib/localStore';
import { syncNow } from '../../../lib/sync';
import type { Recipe } from '../../../lib/types';

export default function FavoritesScreen() {
  const { data: recipes } = useLocalData(localFavorites.list, []);

  return (
    <RecipeList
      recipes={recipes ?? []}
      loading={recipes === null}
      onRefresh={syncNow}
      emptyText="Você ainda não tem favoritos"
      favoriteIds={new Set(recipes?.map((r) => r.id))}
      onToggleFavorite={(recipe: Recipe) => localFavorites.set(recipe.id, false)}
    />
  );
}
