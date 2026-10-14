import React, { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Tabs } from 'expo-router';
import { COLORS } from '../../lib/constants';

type IconName = keyof typeof Ionicons.glyphMap;
type TabsProps = ComponentProps<typeof Tabs>;
type TabOptions = Exclude<NonNullable<TabsProps['screenOptions']>, Function>;
type BottomBarProps = Parameters<NonNullable<TabsProps['tabBar']>>[0];

/** Telas principais: a barra mostra Receitas | Home | Favoritos. */
const MAIN_TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'recipes/index', label: 'Receitas', icon: 'restaurant-outline' },
  { name: 'favorites/index', label: 'Favoritos', icon: 'star-outline' },
];

/** Rota dentro das abas que não aparece na barra. */
export const hidden = { href: null } as TabOptions;

export const tabBarOptions: TabOptions = {
  headerTitleStyle: { fontWeight: 'bold' },
  headerShadowVisible: false,
};

/**
 * Barra inferior: nas telas principais mostra Receitas | Home | Favoritos;
 * nas demais, apenas o botão Home centralizado.
 */
export function BottomBar({ state, navigation }: BottomBarProps) {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const current = state.routes[state.index].name;
  const isMainScreen = MAIN_TABS.some((tab) => tab.name === current);
  const [recipes, favorites] = MAIN_TABS;

  const home = <TabItem label="Home" icon="home-outline" active={false} onPress={() => router.dismissTo('/')} />;

  return (
    <View style={[styles.bar, { paddingBottom: bottom + 8 }]}>
      {isMainScreen ? (
        <>
          <TabItem {...recipes} active={current === recipes.name} onPress={() => navigation.navigate(recipes.name)} />
          {home}
          <TabItem {...favorites} active={current === favorites.name} onPress={() => navigation.navigate(favorites.name)} />
        </>
      ) : (
        home
      )}
    </View>
  );
}

interface TabItemProps {
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
}

function TabItem({ label, icon, active, onPress }: TabItemProps) {
  const color = active ? COLORS.text : COLORS.textSecondary;
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabLabel: { fontSize: 12, fontWeight: '600' },
});
