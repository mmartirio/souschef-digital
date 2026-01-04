import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showProfile?: boolean;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export default function Header({
  title,
  showBack = false,
  showMenu = true,
  showProfile = true,
  rightAction,
}: HeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ) : showMenu ? (
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="menu" size={24} color="#000" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.centerSection}>
        {title ? (
          <Text style={styles.title}>{title}</Text>
        ) : (
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
      </View>

      <View style={styles.rightSection}>
        {rightAction ? (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.iconButton}>
            <Ionicons name={rightAction.icon} size={24} color="#000" />
          </TouchableOpacity>
        ) : showProfile ? (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.iconButton}
          >
            <Ionicons name="person-circle-outline" size={28} color="#000" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leftSection: {
    width: 40,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  logo: {
    width: 40,
    height: 40,
  },
  logoGold: {
    color: '#D4AF37',
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
