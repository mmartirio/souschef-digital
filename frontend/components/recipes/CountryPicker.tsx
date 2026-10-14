import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { localRecipes } from '../../lib/localStore';
import { COLORS, countryLabel, SIZES } from '../../lib/constants';
import type { CountryCount } from '../../lib/types';

interface Props {
  /** País selecionado; null = todos. */
  value: string | null;
  onChange: (country: string | null) => void;
}

/** Filtro por país de criação: um botão que abre a lista de países com a quantidade de receitas. */
export default function CountryPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [countries, setCountries] = useState<CountryCount[]>([]);
  const { bottom } = useSafeAreaInsets();

  useEffect(() => {
    if (open) localRecipes.countries().then(setCountries);
  }, [open]);

  const select = (country: string | null) => {
    onChange(country);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={() => setOpen(true)} accessibilityLabel="Filtrar por país">
        <Text style={styles.buttonText}>{value ? countryLabel(value) : '🌎 Todos os países'}</Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: bottom + 12 }]}>
          <Text style={styles.sheetTitle}>País de criação</Text>
          <FlatList
            data={[null, ...countries.map((c) => c.country)]}
            keyExtractor={(item) => item ?? 'todos'}
            renderItem={({ item }) => {
              const count = countries.find((c) => c.country === item)?.recipe_count;
              const selected = item === value;
              return (
                <TouchableOpacity style={styles.row} onPress={() => select(item)} accessibilityState={{ selected }}>
                  <Text style={[styles.rowText, selected && styles.rowTextSelected]}>
                    {item ? countryLabel(item) : '🌎 Todos os países'}
                  </Text>
                  {count !== undefined && <Text style={styles.count}>{count}</Text>}
                  {selected && <Ionicons name="checkmark" size={20} color={COLORS.secondary} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: SIZES.padding,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  // O texto ocupa a largura disponível (evita o corte de letras do Android).
  buttonText: { flex: 1, fontSize: 14, color: COLORS.text },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '70%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, paddingHorizontal: SIZES.padding, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowText: { flex: 1, fontSize: 16, color: COLORS.text },
  rowTextSelected: { fontWeight: '700' },
  count: { fontSize: 14, color: COLORS.textSecondary },
});
