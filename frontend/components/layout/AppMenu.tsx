import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../lib/auth';
import { COLORS, SIZES } from '../../lib/constants';

type IconName = keyof typeof Ionicons.glyphMap;

const ITEMS: { label: string; icon: IconName; href: Href }[] = [
  { label: 'Perfil', icon: 'person-outline', href: '/profile' },
  { label: 'Categorias', icon: 'grid-outline', href: '/categories' },
  { label: 'Assistente de voz', icon: 'mic-outline', href: '/assistant-settings' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** Menu lateral aberto pelo ícone hambúrguer. */
export default function AppMenu({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const go = (href: Href) => {
    onClose();
    router.push(href);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar menu" />
      <View style={[styles.panel, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.user}>
          <Avatar path={user?.avatar_url} size={56} />
          <View style={styles.userText}>
            <Text style={styles.name} numberOfLines={1}>{user?.full_name || 'Visitante'}</Text>
            {user && <Text style={styles.email} numberOfLines={1}>{user.email}</Text>}
          </View>
        </View>

        {user ? (
          <>
            {ITEMS.map((item) => (
              <MenuItem key={item.label} icon={item.icon} label={item.label} onPress={() => go(item.href)} />
            ))}
            <MenuItem
              icon="log-out-outline"
              label="Sair"
              danger
              onPress={() => {
                onClose();
                void logout();
              }}
            />
          </>
        ) : (
          <MenuItem icon="log-in-outline" label="Entrar" onPress={() => go('/login')} />
        )}
      </View>
    </Modal>
  );
}

interface MenuItemProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, danger }: MenuItemProps) {
  const color = danger ? COLORS.error : COLORS.text;
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.itemText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '78%',
    maxWidth: 320,
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.padding,
  },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  userText: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  email: { fontSize: 13, color: COLORS.textSecondary },
  item: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 },
  itemText: { flex: 1, fontSize: 16 }, // largura explícita evita corte da última letra no Android
});
