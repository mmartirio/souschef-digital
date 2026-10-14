import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppMenu from './AppMenu';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  /** Ícone hambúrguer que abre o menu lateral. */
  showMenu?: boolean;
}

export default function Header({ title, showBack = false, showMenu = true }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerSection}>
        {title ? (
          <Text style={styles.title}>{title}</Text>
        ) : (
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        )}
      </View>

      <View style={styles.rightSection}>
        {showMenu && (
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            style={styles.iconButton}
            accessibilityLabel="Abrir menu"
          >
            <Ionicons name="menu" size={42} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leftSection: {
    width: 50, // mesma largura dos dois lados mantém o logo centralizado
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 50,
    alignItems: 'flex-end',
  },
  logo: {
    // logo.png é o icon.png recortado no desenho (~3.2:1), para centralizar de verdade
    width: 120,
    height: 38,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  iconButton: {
    padding: 4,
  },
});
