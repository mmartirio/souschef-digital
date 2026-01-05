import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { COLORS, SIZES } from '../../../lib/constants';

export default function CreateRecipe() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('1');
  const [difficulty, setDifficulty] = useState('facil');
  const [instructions, setInstructions] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [currentUnit, setCurrentUnit] = useState('g');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const units = ['g', 'ml', 'colher', 'xícara', 'unidade', 'litro'];
  const difficulties = ['facil', 'medio', 'dificil'];

  const addIngredient = () => {
    if (!currentIngredient || !currentQuantity) {
      Alert.alert('Erro', 'Preencha o ingrediente e a quantidade');
      return;
    }
    setIngredients([
      ...ingredients,
      {
        name: currentIngredient,
        quantity: currentQuantity,
        unit: currentUnit,
      },
    ]);
    setCurrentIngredient('');
    setCurrentQuantity('');
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!title) newErrors.title = 'Título é obrigatório';
    if (!description) newErrors.description = 'Descrição é obrigatória';
    if (!prepTime) newErrors.prepTime = 'Tempo de preparo é obrigatório';
    if (!instructions) newErrors.instructions = 'Modo de preparo é obrigatório';
    if (ingredients.length === 0)
      newErrors.ingredients = 'Adicione pelo menos um ingrediente';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateRecipe = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const recipeData = {
        title,
        description,
        prep_time: parseInt(prepTime),
        cook_time: cookTime ? parseInt(cookTime) : 0,
        servings: parseInt(servings),
        difficulty,
        instructions,
        ingredients,
      };

      const response = await fetch('http://localhost:8000/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Adicionar token de autenticação
        },
        body: JSON.stringify(recipeData),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('Sucesso', 'Receita criada com sucesso!', [
          {
            text: 'OK',
            onPress: () => router.replace(`/(tabs)/recipes/${data.id}`),
          },
        ]);
      } else {
        Alert.alert('Erro', 'Falha ao criar receita');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao conectar com o servidor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nova Receita</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Title Section */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Básicas</Text>
            <Input
              label="Título da Receita"
              placeholder="Ex: Bolo de Chocolate"
              value={title}
              onChangeText={setTitle}
              error={errors.title}
            />
            <Input
              label="Descrição"
              placeholder="Descreva sua receita..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              error={errors.description}
            />
          </Card>

          {/* Time and Servings */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Tempo e Porções</Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Tempo de Preparo (min)"
                  placeholder="30"
                  value={prepTime}
                  onChangeText={setPrepTime}
                  keyboardType="numeric"
                  error={errors.prepTime}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Tempo de Cozimento (min)"
                  placeholder="45"
                  value={cookTime}
                  onChangeText={setCookTime}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Input
              label="Porções"
              placeholder="4"
              value={servings}
              onChangeText={setServings}
              keyboardType="numeric"
            />
          </Card>

          {/* Difficulty */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Dificuldade</Text>
            <View style={styles.difficultyButtons}>
              {difficulties.map((diff) => (
                <TouchableOpacity
                  key={diff}
                  style={[
                    styles.difficultyButton,
                    difficulty === diff && styles.difficultyButtonActive,
                  ]}
                  onPress={() => setDifficulty(diff)}
                >
                  <Text
                    style={[
                      styles.difficultyButtonText,
                      difficulty === diff && styles.difficultyButtonTextActive,
                    ]}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Ingredients */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredientes</Text>
            <Input
              label="Nome do Ingrediente"
              placeholder="Ex: Farinha de Trigo"
              value={currentIngredient}
              onChangeText={setCurrentIngredient}
            />
            <View style={styles.ingredientRow}>
              <View style={styles.ingredientQuantity}>
                <Input
                  label="Quantidade"
                  placeholder="2"
                  value={currentQuantity}
                  onChangeText={setCurrentQuantity}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.ingredientUnit}>
                <Text style={styles.label}>Unidade</Text>
                <TouchableOpacity
                  style={styles.unitSelect}
                  onPress={() => {
                    // TODO: Implementar picker de unidades
                    Alert.alert('Unidades', `Selecionado: ${currentUnit}`);
                  }}
                >
                  <Text style={styles.unitText}>{currentUnit}</Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={COLORS.text}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Button
              title="ADICIONAR INGREDIENTE"
              onPress={addIngredient}
              variant="outline"
              icon="add-outline"
            />

            {/* Ingredients List */}
            {ingredients.length > 0 && (
              <View style={styles.ingredientsList}>
                {ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <View style={styles.ingredientContent}>
                      <Text style={styles.ingredientName}>
                        {ingredient.name}
                      </Text>
                      <Text style={styles.ingredientQuantity}>
                        {ingredient.quantity} {ingredient.unit}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeIngredient(index)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#FF3B30"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            {errors.ingredients && (
              <Text style={styles.errorText}>{errors.ingredients}</Text>
            )}
          </Card>

          {/* Instructions */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Modo de Preparo</Text>
            <Input
              label="Instruções"
              placeholder="Descreva o passo a passo..."
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={6}
              error={errors.instructions}
            />
          </Card>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              title="CRIAR RECEITA"
              onPress={handleCreateRecipe}
              loading={loading}
              variant="primary"
            />
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  section: {
    marginHorizontal: SIZES.padding,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  difficultyButtonTextActive: {
    color: '#000',
  },
  ingredientRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  ingredientQuantity: {
    flex: 1,
  },
  ingredientUnit: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  unitSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitText: {
    fontSize: 16,
    color: COLORS.text,
  },
  ingredientsList: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  ingredientQuantity: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  submitContainer: {
    paddingHorizontal: SIZES.padding,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 8,
  },
});
