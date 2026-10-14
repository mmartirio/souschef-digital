import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, DIFFICULTIES, SIZES } from '../../lib/constants';
import type { Recipe } from '../../lib/types';

interface Props {
  recipe: Recipe;
  isFavorite?: boolean;
  onToggleFavorite?: (recipe: Recipe) => void;
}

export default function RecipeCard({ recipe, isFavorite, onToggleFavorite }: Props) {
  const router = useRouter();
  const difficulty = recipe.difficulty ? DIFFICULTIES[recipe.difficulty] : null;
  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0);

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/recipes/${recipe.id}`)}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
        {onToggleFavorite && (
          <TouchableOpacity onPress={() => onToggleFavorite(recipe)} hitSlop={10}>
            <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={22} color={COLORS.secondary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.description} numberOfLines={2}>{recipe.description || 'Sem descrição'}</Text>

      <View style={styles.footer}>
        <Info icon="time-outline" text={`${totalTime} min`} />
        <Info icon="people-outline" text={`${recipe.servings ?? '-'} porções`} />
        {difficulty && (
          <View style={[styles.badge, { backgroundColor: difficulty.color }]}>
            <Text style={styles.badgeText}>{difficulty.label}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function Info({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.info}>
      <Ionicons name={icon} size={16} color={COLORS.textSecondary} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 13, color: COLORS.textSecondary },
  badge: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
});
