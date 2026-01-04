import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface RecipeCardProps {
  id: number;
  title: string;
  description: string;
  prepTime: number;
  difficulty: 'facil' | 'medio' | 'dificil';
  imageUrl?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

export default function RecipeCard({
  id,
  title,
  description,
  prepTime,
  difficulty,
  imageUrl,
  isFavorite = false,
  onFavoriteToggle,
}: RecipeCardProps) {
  const router = useRouter();

  const difficultyColors = {
    facil: '#4CAF50',
    medio: '#FF9800',
    dificil: '#F44336',
  };

  const difficultyLabels = {
    facil: 'Fácil',
    medio: 'Médio',
    dificil: 'Difícil',
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/recipes/${id}`)}
      activeOpacity={0.8}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholderImage]}>
          <Ionicons name="restaurant" size={40} color="#D4AF37" />
        </View>
      )}
      
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={(e) => {
          e.stopPropagation();
          onFavoriteToggle?.();
        }}
      >
        <Ionicons
          name={isFavorite ? 'star' : 'star-outline'}
          size={24}
          color="#D4AF37"
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.infoContainer}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{prepTime} min</Text>
          </View>

          <View style={[styles.difficultyBadge, { backgroundColor: difficultyColors[difficulty] }]}>
            <Text style={styles.difficultyText}>{difficultyLabels[difficulty]}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
});
