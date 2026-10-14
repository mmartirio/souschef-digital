import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Loading from '../../../components/ui/Loading';
import { useLocalData } from '../../../hooks/useLocalData';
import { localRecipes } from '../../../lib/localStore';
import { COLORS, DIFFICULTIES, SIZES } from '../../../lib/constants';
import type { Difficulty } from '../../../lib/types';

const ICONS: Record<Difficulty, keyof typeof Ionicons.glyphMap> = {
  easy: 'flash-outline',
  medium: 'star-half-outline',
  hard: 'flame-outline',
};

export default function CategoriesScreen() {
  const router = useRouter();
  const { data: categories } = useLocalData(localRecipes.categories, []);

  if (!categories) return <Loading />;

  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const color = DIFFICULTIES[item.difficulty].color;
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/recipes', params: { difficulty: item.difficulty } })}
          >
            <View style={[styles.icon, { backgroundColor: color + '20' }]}>
              <Ionicons name={ICONS[item.difficulty]} size={30} color={color} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={[styles.count, { color }]}>
                {item.recipe_count} {item.recipe_count === 1 ? 'receita' : 'receitas'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: SIZES.padding, backgroundColor: COLORS.background, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    marginBottom: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  description: { fontSize: 14, color: COLORS.textSecondary, marginVertical: 2 },
  count: { fontSize: 13, fontWeight: '600' },
});
