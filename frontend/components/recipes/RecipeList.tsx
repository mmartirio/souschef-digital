import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RecipeCard from './RecipeCard';
import Loading from '../ui/Loading';
import { COLORS, SIZES } from '../../lib/constants';
import type { Recipe } from '../../lib/types';

interface Props {
  recipes: Recipe[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyText?: string;
  favoriteIds?: Set<number>;
  onToggleFavorite?: (recipe: Recipe) => void;
}

export default function RecipeList({
  recipes,
  loading,
  refreshing = false,
  onRefresh,
  emptyText = 'Nenhuma receita encontrada',
  favoriteIds,
  onToggleFavorite,
}: Props) {
  if (loading) return <Loading />;

  return (
    <FlatList
      data={recipes}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <RecipeCard
          recipe={item}
          isFavorite={favoriteIds?.has(item.id)}
          onToggleFavorite={onToggleFavorite}
        />
      )}
      contentContainerStyle={styles.list}
      refreshControl={onRefresh && <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="restaurant-outline" size={56} color={COLORS.border} />
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: SIZES.padding, flexGrow: 1 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
});
