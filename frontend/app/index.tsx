import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/layout/Header';
import { COLORS, SIZES } from '../lib/constants';

const TITLE = 'O QUE VAMOS COZINHAR HOJE?';
// Botão + fica 24 px acima da barra de navegação do aparelho; o conteúdo reserva espaço para ele.
const ADD_BUTTON_SPACE = 24 + 64 + 24;

/** Efeito de digitação que se repete periodicamente. */
function useTypewriter(text: string, speedMs = 80, repeatMs = 10000) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    let typing: ReturnType<typeof setInterval>;
    const type = () => {
      let i = 0;
      clearInterval(typing);
      typing = setInterval(() => {
        setShown(text.slice(0, ++i));
        if (i >= text.length) clearInterval(typing);
      }, speedMs);
    };
    type();
    const repeat = setInterval(type, repeatMs);
    return () => {
      clearInterval(typing);
      clearInterval(repeat);
    };
  }, [text, speedMs, repeatMs]);
  return shown;
}

/** Flutuação contínua: sobe e desce suavemente (translateY para usar em Animated.View). */
function useFloat(distance = 6, durationMs = 1500) {
  const offset = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const move = (toValue: number) =>
      Animated.timing(offset, { toValue, duration: durationMs, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([move(-distance), move(0)]));
    loop.start();
    return () => loop.stop();
  }, [offset, distance, durationMs]);
  return offset;
}

/** Chacoalhar: balança por `shakeMs` e para por `pauseMs` antes de repetir (rotate para Animated). */
function useShake(shakeMs = 1000, pauseMs = 5000, swingMs = 100, angle = 6) {
  const swing = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const to = (toValue: number) => Animated.timing(swing, { toValue, duration: swingMs, useNativeDriver: true });
    const swings = Math.max(2, Math.floor(shakeMs / swingMs) - 1);
    const loop = Animated.loop(
      Animated.sequence([
        ...Array.from({ length: swings }, (_, i) => to(i % 2 ? -1 : 1)),
        to(0),
        Animated.delay(pauseMs),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [swing, shakeMs, pauseMs, swingMs]);
  return [{ rotate: swing.interpolate({ inputRange: [-1, 1], outputRange: [`-${angle}deg`, `${angle}deg`] }) }];
}

export default function Home() {
  const router = useRouter();
  const title = useTypewriter(TITLE);
  const float = useFloat();
  const shake = useShake();
  const { bottom: navBarHeight } = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <Header />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: navBarHeight + ADD_BUTTON_SPACE }}>
        <View style={styles.voiceSection}>
          <Animated.View style={{ transform: [{ translateY: float }, ...shake] }}>
            <TouchableOpacity
              style={styles.micButton}
              onPress={() =>
                router.push({ pathname: '/ai-assistant', params: { voice: String(Date.now()) } })
              }
            >
              <Ionicons name="mic" size={30} color={COLORS.background} />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.micHint}>Clique aqui para falar com o Chef</Text>

          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.heroContainer}>
          <Image source={require('../assets/HeroImage.png')} style={styles.hero} resizeMode="cover" />
          {/* Esmaece só a parte de baixo da imagem, dissolvendo-a na cor de fundo. */}
          <LinearGradient colors={[`${COLORS.background}00`, COLORS.background]} style={styles.heroFade} />
        </View>

        <View style={styles.quickAccess}>
          <Text style={styles.sectionTitle}>ACESSO RÁPIDO</Text>
          <View style={styles.quickButtons}>
            <QuickButton icon="restaurant-outline" label="RECEITAS" onPress={() => router.push('/recipes')} />
            <QuickButton icon="star-outline" label="FAVORITOS" onPress={() => router.push('/favorites')} />
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.addButton, { bottom: navBarHeight + 24 }]}
        onPress={() => router.push('/recipes/create')}
        accessibilityLabel="Adicionar nova receita"
      >
        <Ionicons name="add" size={36} color={COLORS.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

interface QuickButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

function QuickButton({ icon, label, onPress }: QuickButtonProps) {
  return (
    <TouchableOpacity style={styles.quickButton} onPress={onPress}>
      <Ionicons name={icon} size={16} color={COLORS.text} />
      <Text style={styles.quickButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  addButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  voiceSection: { alignItems: 'center', gap: 12, padding: SIZES.padding, marginBottom: 8 },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micHint: { fontSize: 12, color: COLORS.textSecondary },
  title: { minHeight: 22, fontSize: 16, fontWeight: 'bold', color: COLORS.text, letterSpacing: 1 },
  heroContainer: { marginBottom: 24 },
  hero: { width: '100%', height: 380, borderRadius: 20 },
  // Altura do esmaecimento: aumente para a transparência começar mais acima na imagem.
  heroFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '35%' },
  quickAccess: { paddingHorizontal: SIZES.padding, marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1, marginBottom: 16 },
  quickButtons: { flexDirection: 'row', gap: 16 },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  quickButtonText: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1, color: COLORS.text },
});
