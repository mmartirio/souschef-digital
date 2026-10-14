import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Loading from '../../../components/ui/Loading';
import IngredientItem from '../../../components/recipes/IngredientItem';
import RecipeWritingGuide from '../../../components/recipes/RecipeWritingGuide';
import { errorMessage } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { localRecipes } from '../../../lib/localStore';
import { COLORS, DIFFICULTIES, SIZES } from '../../../lib/constants';
import type { Difficulty, Ingredient, Recipe } from '../../../lib/types';

const toInt = (value: string) => (value.trim() ? parseInt(value, 10) || null : null);
const toText = (value: number | null | undefined) => (value == null ? '' : String(value));

const EMPTY_FORM = { title: '', description: '', instructions: '', prepTime: '', cookTime: '', servings: '', country: '' };

const formFrom = (recipe: Recipe) => ({
  title: recipe.title,
  description: recipe.description ?? '',
  instructions: recipe.instructions,
  prepTime: toText(recipe.prep_time),
  cookTime: toText(recipe.cook_time),
  servings: toText(recipe.servings),
  country: recipe.country ?? '',
});

/** Cria uma receita, ou edita a receita `?id=` (só o autor pode salvar). */
export default function RecipeForm() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const editingId = Number(useLocalSearchParams<{ id?: string }>().id) || null;
  const [form, setForm] = useState(EMPTY_FORM);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredient, setIngredient] = useState({ name: '', quantity: '' });
  const [loading, setLoading] = useState(editingId !== null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editingId ? 'Editar receita' : 'Nova receita' });
    if (!editingId) {
      setForm(EMPTY_FORM);
      setDifficulty('easy');
      setIngredients([]);
      return;
    }
    setLoading(true);
    localRecipes
      .get(editingId)
      .then((recipe) => {
        if (!recipe) throw new Error('Receita não encontrada');
        setForm(formFrom(recipe));
        setDifficulty(recipe.difficulty ?? 'easy');
        setIngredients(recipe.ingredients.map(({ name, quantity }) => ({ name, quantity })));
      })
      .catch((e) => {
        Alert.alert('Erro', errorMessage(e, 'Receita não encontrada'));
        router.back();
      })
      .finally(() => setLoading(false));
  }, [editingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: keyof typeof form) => (value: string) => setForm({ ...form, [field]: value });

  const addIngredient = () => {
    if (!ingredient.name.trim()) return;
    setIngredients([...ingredients, { name: ingredient.name.trim(), quantity: ingredient.quantity.trim() || null }]);
    setIngredient({ name: '', quantity: '' });
  };

  const save = async () => {
    if (!form.title.trim() || !form.instructions.trim()) {
      Alert.alert('Atenção', 'Título e modo de preparo são obrigatórios.');
      return;
    }
    setSaving(true);
    const data = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      instructions: form.instructions.trim(),
      prep_time: toInt(form.prepTime),
      cook_time: toInt(form.cookTime),
      servings: toInt(form.servings),
      difficulty,
      country: form.country.trim() || null,
      ingredients,
    };
    try {
      // Salva no banco local; o envio ao servidor acontece em segundo plano (lib/sync.ts).
      const recipe = editingId
        ? await localRecipes.update(editingId, data)
        : await localRecipes.create(data, user!.id);
      router.replace(`/recipes/${recipe.id}`);
    } catch (e) {
      Alert.alert('Erro', errorMessage(e, editingId ? 'Falha ao salvar a receita' : 'Falha ao criar receita'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <RecipeWritingGuide />

        <Card>
          <Input label="Título" placeholder="Ex: Bolo de Chocolate" value={form.title} onChangeText={set('title')} />
          <Input label="Descrição" value={form.description} onChangeText={set('description')} multiline />
          <Input label="País de criação (opcional)" placeholder="Ex: Brasil" value={form.country} onChangeText={set('country')} />
        </Card>

        <Card>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Input label="Preparo (min)" value={form.prepTime} onChangeText={set('prepTime')} keyboardType="numeric" />
            </View>
            <View style={styles.flex}>
              <Input label="Cozimento (min)" value={form.cookTime} onChangeText={set('cookTime')} keyboardType="numeric" />
            </View>
            <View style={styles.flex}>
              <Input label="Porções" value={form.servings} onChangeText={set('servings')} keyboardType="numeric" />
            </View>
          </View>

          <Text style={styles.label}>Dificuldade</Text>
          <View style={styles.row}>
            {(Object.keys(DIFFICULTIES) as Difficulty[]).map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.chip, difficulty === value && { backgroundColor: DIFFICULTIES[value].color }]}
                onPress={() => setDifficulty(value)}
              >
                <Text style={[styles.chipText, difficulty === value && styles.chipTextActive]}>
                  {DIFFICULTIES[value].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>Ingredientes</Text>
          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Input
                placeholder="Ingrediente"
                value={ingredient.name}
                onChangeText={(name) => setIngredient({ ...ingredient, name })}
              />
            </View>
            <View style={styles.flex}>
              <Input
                placeholder="2 xícaras"
                value={ingredient.quantity}
                onChangeText={(quantity) => setIngredient({ ...ingredient, quantity })}
              />
            </View>
          </View>
          <Button title="ADICIONAR" icon="add-outline" variant="outline" onPress={addIngredient} />
          {ingredients.map((item, index) => (
            <IngredientItem
              key={index}
              ingredient={item}
              onRemove={() => setIngredients(ingredients.filter((_, i) => i !== index))}
            />
          ))}
        </Card>

        <Card>
          <Input
            label="Modo de preparo (veja o guia no topo)"
            placeholder={'## Massa\n1. Misture...\n2. Asse...\n## Cobertura\n1. Derreta...'}
            value={form.instructions}
            onChangeText={set('instructions')}
            multiline
          />
        </Card>

        <Button title={editingId ? 'SALVAR ALTERAÇÕES' : 'SALVAR RECEITA'} onPress={save} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: SIZES.padding, gap: 16, backgroundColor: COLORS.background },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  chipTextActive: { color: '#FFF' },
});
