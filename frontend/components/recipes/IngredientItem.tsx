import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { describeIngredient } from '../../lib/recipeSpeech';
import type { Ingredient } from '../../lib/types';

interface Props {
  ingredient: Ingredient;
  onRemove?: () => void;
}

export default function IngredientItem({ ingredient, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>• {describeIngredient(ingredient)}</Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} hitSlop={10}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  text: { flex: 1, fontSize: 15, color: COLORS.text },
});
