import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';

type Variant = 'primary' | 'secondary' | 'outline' | 'tonal';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
}

/** Fundo, borda e cor do conteúdo (texto, ícone e carregamento) de cada variante. */
const VARIANTS: Record<Variant, { container: object; content: string }> = {
  primary: { container: { backgroundColor: COLORS.secondary }, content: COLORS.primary },
  secondary: { container: { backgroundColor: COLORS.primary }, content: '#FFF' },
  outline: { container: { borderWidth: 2, borderColor: COLORS.secondary }, content: COLORS.secondary },
  tonal: { container: { backgroundColor: COLORS.secondaryDark }, content: '#FFF' },
};

export default function Button({ title, onPress, variant = 'primary', icon, loading = false, disabled = false }: ButtonProps) {
  const { container, content } = VARIANTS[variant];

  return (
    <TouchableOpacity
      style={[styles.button, container, (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={content} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color={content} style={styles.icon} />}
          <Text style={[styles.text, { color: content }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 50,
  },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  icon: { marginRight: 8 },
});
