import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import GuidedRecipeMode from '../../../components/recipes/GuidedRecipeMode';
import { COLORS, SIZES } from '../../../lib/constants';

export default function RecipeDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showGuidedMode, setShowGuidedMode] = useState(false);

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/recipes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setRecipe(data);
        // TODO: Verificar se está nos favoritos
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar receita');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    try {
      if (isFavorite) {
        // Remove dos favoritos
        await fetch(`http://localhost:8000/favorites/${id}`, {
          method: 'DELETE',
        });
      } else {
        // Adiciona aos favoritos
        await fetch('http://localhost:8000/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe_id: id }),
        });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar favoritos');
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      facil: '#4CAF50',
      medio: '#FF9800',
      dificil: '#F44336',
    };
    return colors[difficulty] || '#666';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Receita não encontrada</Text>
          <Button
            title="Voltar"
            onPress={() => router.back()}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Image */}
        <View style={styles.imageContainer}>
          {recipe.image_url ? (
            <Image
              source={{ uri: recipe.image_url }}
              style={styles.image}
            />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Ionicons name="restaurant" size={60} color={COLORS.secondary} />
            </View>
          )}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavorite}
          >
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={28}
              color="#D4AF37"
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Difficulty */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {recipe.title}
              </Text>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(recipe.difficulty) },
                ]}
              >
                <Text style={styles.difficultyText}>
                  {recipe.difficulty.charAt(0).toUpperCase() +
                    recipe.difficulty.slice(1)}
                </Text>
              </View>
            </View>
          </View>

          {/* Info Row */}
          <View style={styles.infoRow}>
            <Card style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={20} color={COLORS.secondary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Preparo</Text>
                  <Text style={styles.infoValue}>{recipe.prep_time} min</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Ionicons name="flame-outline" size={20} color={COLORS.secondary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Cozimento</Text>
                  <Text style={styles.infoValue}>{recipe.cook_time || 0} min</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Ionicons name="people-outline" size={20} color={COLORS.secondary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Porções</Text>
                  <Text style={styles.infoValue}>{recipe.servings}</Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Description */}
          {recipe.description && (
            <Card>
              <Text style={styles.sectionTitle}>Descrição</Text>
              <Text style={styles.description}>{recipe.description}</Text>
            </Card>
          )}

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Ingredientes</Text>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientText}>
                    • {ingredient.name} - {ingredient.quantity}{' '}
                    {ingredient.unit}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {/* Instructions */}
          {recipe.instructions && (
            <Card>
              <Text style={styles.sectionTitle}>Modo de Preparo</Text>
              <Text style={styles.instructions}>{recipe.instructions}</Text>
            </Card>
          )}

          {/* User Info */}
          {recipe.user && (
            <Card>
              <View style={styles.userCard}>
                <Ionicons
                  name="person-circle-outline"
                  size={48}
                  color={COLORS.secondary}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{recipe.user.name}</Text>
                  <Text style={styles.userEmail}>{recipe.user.email}</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Button
              title="🎙️ MODO GUIADO"
              onPress={() => setShowGuidedMode(true)}
              variant="primary"
              icon="mic"
              style={{ flex: 1 }}
            />
            <Button
              title="COMPARTILHAR"
              onPress={() => Alert.alert('Info', 'Compartilhamento em desenvolvimento')}
              variant="outline"
              icon="share-social-outline"
            />
          </View>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      <Modal
        visible={showGuidedMode}
        animationType="slide"
        transparent={false}
      >
        <GuidedRecipeMode
          recipeId={parseInt(id as string)}
          recipeName={recipe?.title || 'Receita'}
          onClose={() => setShowGuidedMode(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.cardBg,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 32,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    padding: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  ingredientItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ingredientText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  instructions: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: 20,
    gap: 12,
  },
});
