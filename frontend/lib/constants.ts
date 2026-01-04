// App constants
export const COLORS = {
  primary: '#000000',        // Preto do texto principal
  secondary: '#D4AF37',      // Dourado/bege do logo
  background: '#FFFFFF',     // Branco de fundo
  text: '#000000',           // Texto preto
  textSecondary: '#666666',  // Texto secundário
  border: '#E0E0E0',         // Bordas
  cardBg: '#F5F5F5',         // Fundo de cards
  accent: '#FF6B6B',         // Cor de destaque
};

export const FONTS = {
  regular: 'System',
  bold: 'System',
  title: 'System',
};

export const SIZES = {
  padding: 16,
  radius: 12,
  iconSmall: 20,
  iconMedium: 24,
  iconLarge: 32,
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
