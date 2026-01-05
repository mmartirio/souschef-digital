import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { COLORS, SIZES, API_URL } from '../../../lib/constants';

interface Recipe {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  prep_time: number;
  cook_time: number;
  servings: number;
}

export default function RecipesScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthToken(data.session?.access_token ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthToken(session?.access_token ?? null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const fetchRecipes = async () => {
    try {
      let url = `${API_URL}/recipes/`;
      const params = [];
      
      if (searchQuery) params.push(`search=${searchQuery}`);
      if (filter !== 'all') params.push(`difficulty=${filter}`);
      
      if (params.length > 0) url += `?${params.join('&')}`;

      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const body = await response.text();
        console.error('Erro ao buscar receitas:', response.status, body);
        return;
      }

      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error('Erro ao buscar receitas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [searchQuery, filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecipes();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return COLORS.textSecondary;
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
      default: return difficulty;
    }
  };

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => router.push(`/(tabs)/recipes/${item.id}`)}
    >
      <View style={styles.recipeHeader}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View 
          style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(item.difficulty) }
          ]}
        >
          <Text style={styles.difficultyText}>
            {getDifficultyText(item.difficulty)}
          </Text>
        </View>
      </View>

      <Text style={styles.recipeDescription} numberOfLines={2}>
        {item.description || 'Sem descrição'}
      </Text>

      <View style={styles.recipeInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            {(item.prep_time || 0) + (item.cook_time || 0)}min
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="people-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>{item.servings || 0} porções</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar receitas..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'easy' && styles.filterButtonActive]}
          onPress={() => setFilter('easy')}
        >
          <Text style={[styles.filterText, filter === 'easy' && styles.filterTextActive]}>
            Fáceis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'medium' && styles.filterButtonActive]}
          onPress={() => setFilter('medium')}
        >
          <Text style={[styles.filterText, filter === 'medium' && styles.filterTextActive]}>
            Médias
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'hard' && styles.filterButtonActive]}
          onPress={() => setFilter('hard')}
        >
          <Text style={[styles.filterText, filter === 'hard' && styles.filterTextActive]}>
            Difíceis
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recipes List */}
      <FlatList
        data={recipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>Nenhuma receita encontrada</Text>
            <Text style={styles.emptySubtext}>
              Tente ajustar os filtros de busca
            </Text>
          </View>
        }
      />

      {/* FAB - Add Recipe */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/recipes/create')}
      >
        <Ionicons name="add" size={28} color={COLORS.background} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  searchSection: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 45,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.background,
  },
  listContainer: {
    padding: SIZES.padding,
  },
  recipeCard: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: COLORS.background,
    fontWeight: '600',
  },
  recipeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  recipeInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
