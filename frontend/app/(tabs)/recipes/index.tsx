import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CountryPicker from '../../../components/recipes/CountryPicker';
import RecipeList from '../../../components/recipes/RecipeList';
import { useFavorites } from '../../../hooks/useFavorites';
import { useLocalData } from '../../../hooks/useLocalData';
import { localRecipes } from '../../../lib/localStore';
import { syncNow } from '../../../lib/sync';
import { COLORS, DIFFICULTIES, SIZES } from '../../../lib/constants';
import type { Difficulty } from '../../../lib/types';

const FILTERS: (Difficulty | null)[] = [null, 'easy', 'medium', 'hard'];

export default function RecipesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ search?: string; difficulty?: Difficulty; country?: string }>();
  const [search, setSearch] = useState(params.search ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(params.difficulty ?? null);
  const [country, setCountry] = useState<string | null>(params.country ?? null);
  const [refreshing, setRefreshing] = useState(false);
  const favorites = useFavorites();

  // Parâmetros vindos da home/categorias
  useEffect(() => {
    if (params.search !== undefined) setSearch(params.search);
    if (params.difficulty !== undefined) setDifficulty(params.difficulty);
    if (params.country !== undefined) setCountry(params.country);
  }, [params.search, params.difficulty, params.country]);

  // Busca no banco local: instantânea e funciona sem conexão.
  const { data: recipes } = useLocalData(
    () => localRecipes.list({ search, difficulty, country }),
    [search, difficulty, country],
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar receitas..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filters}>
        {FILTERS.map((value) => {
          const active = difficulty === value;
          return (
            <TouchableOpacity
              key={value ?? 'all'}
              style={[styles.filter, active && styles.filterActive]}
              onPress={() => setDifficulty(value)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {value ? DIFFICULTIES[value].label : 'Todas'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <CountryPicker value={country} onChange={setCountry} />

      <RecipeList
        recipes={recipes ?? []}
        loading={recipes === null}
        refreshing={refreshing}
        onRefresh={async () => {
          // Puxar para atualizar: envia o que está pendente e baixa as novidades do servidor.
          setRefreshing(true);
          await syncNow();
          setRefreshing(false);
        }}
        favoriteIds={favorites.ids}
        onToggleFavorite={(recipe) => favorites.toggle(recipe.id)}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/recipes/create')}>
        <Ionicons name="add" size={28} color={COLORS.background} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: SIZES.padding,
    marginBottom: 8,
    paddingHorizontal: 16,
    height: 45,
    borderRadius: 25,
    backgroundColor: COLORS.cardBg,
  },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.text },
  // Os 4 filtros dividem a linha em partes iguais.
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: SIZES.padding },
  filter: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  filterActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  // O texto ocupa a largura inteira do card (centralizado), e não só a medida da palavra:
  // em alguns Android a fonte é desenhada mais larga que a medida e as últimas letras sumiam.
  filterText: { fontSize: 14, color: COLORS.text, textAlign: 'center' },
  filterTextActive: { color: COLORS.background },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});
