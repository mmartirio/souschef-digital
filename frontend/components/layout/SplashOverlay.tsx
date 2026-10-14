import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// A splash nativa do Android 12+ só mostra um ícone central; esta camada exibe a imagem em
// tela cheia logo em seguida (a colher fica no mesmo lugar, então a troca é imperceptível).
void SplashScreen.preventAutoHideAsync();

const VISIBLE_MS = 1200;
const FADE_MS = 300;
const FALLBACK_MS = 500;

const hideNative = () => void SplashScreen.hideAsync().catch(() => undefined);

export default function SplashOverlay() {
  const [done, setDone] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Garantia: se a imagem não avisar que carregou, a splash nativa não pode ficar presa.
    const fallback = setTimeout(hideNative, FALLBACK_MS);
    const timer = setTimeout(
      () => Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() => setDone(true)),
      VISIBLE_MS,
    );
    return () => {
      clearTimeout(fallback);
      clearTimeout(timer);
    };
  }, [opacity]);

  if (done) return null;
  return (
    <Animated.Image
      source={require('../../assets/splash.png')}
      resizeMode="cover"
      fadeDuration={0}
      onLoadEnd={hideNative}
      style={[StyleSheet.absoluteFill, styles.image, { opacity }]}
    />
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%', backgroundColor: '#ffffff' },
});
