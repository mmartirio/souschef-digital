import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mediaUrl } from '../../lib/api';
import { COLORS } from '../../lib/constants';

interface Props {
  path: string | null | undefined;
  size?: number;
}

/** Foto do usuário ou ícone padrão. */
export default function Avatar({ path, size = 48 }: Props) {
  const uri = mediaUrl(path ?? null);
  const shape = { width: size, height: size, borderRadius: size / 2 };

  return uri ? (
    <Image source={{ uri }} style={[styles.base, shape]} />
  ) : (
    <View style={[styles.base, shape]}>
      <Ionicons name="person" size={size * 0.55} color={COLORS.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center' },
});
