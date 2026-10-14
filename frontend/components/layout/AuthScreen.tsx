import React, { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Moldura comum das telas de login/cadastro. */
export default function AuthScreen({ title, subtitle, children }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Ionicons name="restaurant" size={56} color={COLORS.secondary} />
            <Text style={styles.logoText}>SOUSCHEF</Text>
            <Text style={styles.logoSubtext}>DIGITAL</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const authStyles = StyleSheet.create({
  spacer: { height: 12 },
  footer: { textAlign: 'center', marginTop: 24, fontSize: 14, color: COLORS.textSecondary },
  link: { color: COLORS.secondary, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, padding: 24 },
  logo: { alignItems: 'center', marginVertical: 32 },
  logoText: { fontSize: 28, fontWeight: '700', letterSpacing: 2, marginTop: 8, color: COLORS.text },
  logoSubtext: { fontSize: 12, letterSpacing: 3, color: COLORS.textSecondary },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 28 },
});
