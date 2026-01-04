import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../lib/constants';

export default function Index() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedText, setDisplayedText] = useState('O QUE VOCÊ VAI COZINHAR HOJE?');
  const fullText = 'O QUE VOCÊ VAI COZINHAR HOJE?';
  const animatedOpacity = new Animated.Value(1);

  useEffect(() => {
    const startAnimation = () => {
      setDisplayedText('');
      
      // Desaparece
      Animated.timing(animatedOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start(() => {
        // Aparece e digita letra por letra
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();

        // Digita letra por letra
        let letterIndex = 0;
        const typeInterval = setInterval(() => {
          if (letterIndex <= fullText.length) {
            setDisplayedText(fullText.substring(0, letterIndex));
            letterIndex++;
          } else {
            clearInterval(typeInterval);
          }
        }, 80);
      });
    };

    const interval = setInterval(startAnimation, 10000);
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = {
    opacity: animatedOpacity,
  };

  const handleVoiceSearch = () => {
    // TODO: Implementar busca por voz
    console.log('Busca por voz');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/(tabs)/recipes?search=${searchQuery}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={28} color={COLORS.text} />
          </TouchableOpacity>

          <Image
            source={require('../assets/icon.png')}
            style={styles.logoContainer}
            resizeMode="contain"
          />

          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person-outline" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons 
              name="search" 
              size={15} 
              color={COLORS.textSecondary} 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar receitas..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity 
            style={styles.micButton}
            onPress={handleVoiceSearch}
          >
            <Ionicons name="mic" size={28} color={COLORS.text} />
          </TouchableOpacity>

          <Animated.Text style={[styles.mainTitle, animatedStyle]}>
            {displayedText}
          </Animated.Text>
        </View>

        {/* Hero Image */}
        <View style={styles.heroImageContainer}>
          <Image
            source={require('../assets/HeroImage.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* Quick Access Section */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>ACESSO RÁPIDO</Text>
          
          <View style={styles.quickAccessButtons}>
            <TouchableOpacity 
              style={styles.quickButton}
              onPress={() => router.push('/(tabs)/recipes')}
            >
              <Ionicons name="restaurant-outline" size={16} color={COLORS.text} />
              <Text style={styles.quickButtonText}>RECEITAS</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickButton}
              onPress={() => router.push('/(tabs)/recipes')} // TODO: Criar tela de favoritos
            >
              <Ionicons name="star-outline" size={16} color={COLORS.text} />
              <Text style={styles.quickButtonText}>FAVORITOS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
  },
  menuButton: {
    padding: 8,
  },
  logoContainer: {
    width: 150,
    height: 90,
    top: 40,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 3,
  },
  profileButton: {
    padding: 8,
  },
  searchSection: {
    flexDirection: 'column',
    paddingHorizontal: SIZES.padding,
    marginTop: 16,
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
  },
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
    paddingHorizontal: SIZES.padding,
  },
  heroImageContainer: {
    marginHorizontal: 0,
    marginBottom: 32,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  heroImage: {
    width: '100%',
    height: 240,
  },
  sectionDivider: {
    height: 2,
    marginHorizontal: SIZES.padding,
    marginBottom: 24,
    backgroundColor: COLORS.border,
  },
  quickAccessSection: {
    paddingHorizontal: SIZES.padding,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    letterSpacing: 1,
    textAlign: 'center',
  },
  quickAccessButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  quickButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.text,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  quickButtonText: {
    marginTop: 0,
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 1,
  },
  categoriesSection: {
    paddingHorizontal: SIZES.padding,
    marginBottom: 32,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radius,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
});
