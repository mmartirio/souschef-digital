import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Loading from '../../../components/ui/Loading';
import Modal from '../../../components/ui/Modal';
import IngredientItem from '../../../components/recipes/IngredientItem';
import GuidedRecipeMode from '../../../components/recipes/GuidedRecipeMode';
import { useFavorites } from '../../../hooks/useFavorites';
import { useLocalData } from '../../../hooks/useLocalData';
import { useAuth } from '../../../lib/auth';
import { COLORS, countryLabel, DIFFICULTIES, SIZES } from '../../../lib/constants';
import { localRecipes } from '../../../lib/localStore';
import { describeIngredient } from '../../../lib/recipeSpeech';

export default function RecipeDetail() {
  const router = useRouter();
  const { user } = useAuth();
  // `guided` muda a cada pedido do assistente de voz e abre direto o modo guiado.
  const params = useLocalSearchParams<{ id: string; guided?: string }>();
  const recipeId = Number(params.id);
  // Lida do banco local: mostra na hora o que acabou de ser salvo, com ou sem conexão.
  const { data: recipe } = useLocalData(() => localRecipes.get(recipeId), [recipeId]);
  const [guided, setGuided] = useState(false);
  const favorites = useFavorites();

  useEffect(() => {
    if (params.guided && recipe?.id === recipeId) setGuided(true);
  }, [params.guided, recipe?.id, recipeId]);

  if (!recipe) return <Loading />;

  const difficulty = recipe.difficulty ? DIFFICULTIES[recipe.difficulty] : null;
  const isOwner = user?.id === recipe.user_id;
  const canEdit = isOwner || recipe.from_book;

  const share = () =>
    Share.share({
      title: recipe.title,
      message: [
        recipe.title,
        recipe.ingredients.map((i) => `• ${describeIngredient(i)}`).join('\n'),
        recipe.instructions,
      ].join('\n\n'),
    });

  const remove = () =>
    Alert.alert('Excluir receita', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await localRecipes.remove(recipe.id);
          router.replace('/recipes');
        },
      },
    ]);

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{recipe.title}</Text>
          <TouchableOpacity onPress={() => favorites.toggle(recipe.id)} hitSlop={10}>
            <Ionicons
              name={favorites.ids.has(recipe.id) ? 'star' : 'star-outline'}
              size={28}
              color={COLORS.secondary}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.tags}>
          {difficulty && (
            <Text style={[styles.badge, { backgroundColor: difficulty.color }]}>{difficulty.label}</Text>
          )}
          {!!recipe.country && <Text style={styles.country}>{countryLabel(recipe.country)}</Text>}
        </View>

        <View style={styles.infoRow}>
          <Info icon="time-outline" label="Preparo" value={`${recipe.prep_time ?? 0} min`} />
          <Info icon="flame-outline" label="Cozimento" value={`${recipe.cook_time ?? 0} min`} />
          <Info icon="people-outline" label="Porções" value={String(recipe.servings ?? '-')} />
        </View>

        {!!recipe.description && (
          <Card>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.body}>{recipe.description}</Text>
          </Card>
        )}

        {recipe.ingredients.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Ingredientes</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <IngredientItem key={ingredient.id ?? index} ingredient={ingredient} />
            ))}
          </Card>
        )}

        <Card>
          <Text style={styles.sectionTitle}>Modo de Preparo</Text>
          {/* Linhas "## Título" separam os preparos (ex.: massa, recheio, cobertura). */}
          {recipe.instructions.split('\n').map((line, i) => {
            const stage = line.match(/^\s*##\s*(.+)$/);
            return stage ? (
              <Text key={i} style={styles.stageTitle}>{stage[1]}</Text>
            ) : (
              <Text key={i} style={styles.body}>{line}</Text>
            );
          })}
        </Card>

        <Button title="MODO GUIADO POR VOZ" icon="mic" onPress={() => setGuided(true)} />
        <Button title="COMPARTILHAR" icon="share-social-outline" variant="outline" onPress={share} />
        {canEdit && (
          <Button
            title="EDITAR"
            icon="create-outline"
            variant="tonal"
            onPress={() => router.push({ pathname: '/recipes/create', params: { id: String(recipe.id) } })}
          />
        )}
        {isOwner && <Button title="EXCLUIR" icon="trash-outline" variant="secondary" onPress={remove} />}
      </ScrollView>

      <Modal visible={guided} onClose={() => setGuided(false)}>
        <GuidedRecipeMode recipeId={recipe.id} onClose={() => setGuided(false)} />
      </Modal>
    </>
  );
}

function Info({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <Card style={styles.infoCard}>
      <Ionicons name={icon} size={20} color={COLORS.secondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: SIZES.padding, gap: 16, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { flex: 1, fontSize: 24, fontWeight: '700', color: COLORS.text },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  tags: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  country: { fontSize: 14, color: COLORS.textSecondary },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoCard: { flex: 1, alignItems: 'center', gap: 2, padding: 12 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary },
  infoValue: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  body: { fontSize: 15, lineHeight: 22, color: COLORS.text },
  stageTitle: { fontSize: 16, fontWeight: '700', color: COLORS.secondary, marginTop: 12, marginBottom: 4 },
});
