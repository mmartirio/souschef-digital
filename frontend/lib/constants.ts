import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { Difficulty } from './types';

export const COLORS = {
  primary: '#000000',
  secondary: '#D4AF37',
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
  cardBg: '#F5F5F5',
  accent: '#FF6B6B',
  success: '#2E8B57',
  secondaryDark: '#8B6B1F', // dourado escuro (bronze) para ações secundárias, ex.: editar
  error: '#F44336',
};

export const SIZES = {
  padding: 16,
  radius: 12,
};

export const DIFFICULTIES: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: 'Fácil', color: '#4CAF50' },
  medium: { label: 'Médio', color: '#FF9800' },
  hard: { label: 'Difícil', color: '#F44336' },
};

/** Bandeiras dos países de criação das receitas. */
export const COUNTRY_FLAGS: Record<string, string> = {
  Brasil: '🇧🇷', Portugal: '🇵🇹', Itália: '🇮🇹', França: '🇫🇷', Espanha: '🇪🇸', 'Reino Unido': '🇬🇧',
  'Estados Unidos': '🇺🇸', México: '🇲🇽', Argentina: '🇦🇷', Peru: '🇵🇪', Canadá: '🇨🇦', Hungria: '🇭🇺',
  Grécia: '🇬🇷', Rússia: '🇷🇺', Suíça: '🇨🇭', Áustria: '🇦🇹', Bélgica: '🇧🇪', 'Nova Zelândia': '🇳🇿', Líbano: '🇱🇧',
  Japão: '🇯🇵', China: '🇨🇳', Tailândia: '🇹🇭', Índia: '🇮🇳', Marrocos: '🇲🇦', Tunísia: '🇹🇳',
  'Coreia do Sul': '🇰🇷', Vietnã: '🇻🇳',
};

/** Nome do país com a bandeira (ou um globo, se o país não estiver no mapa). */
export const countryLabel = (country: string) => `${COUNTRY_FLAGS[country] ?? '🌍'} ${country}`;

// Em desenvolvimento, usa o mesmo host do Metro (funciona em celular físico e emulador).
const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
// O Expo Go não confia na CA do Caddy (só o APK a embute): fala HTTP direto com o backend.
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
export const API_URL =
  (!inExpoGo && process.env.EXPO_PUBLIC_API_URL) || `http://${devHost ?? 'localhost'}:8000`;
