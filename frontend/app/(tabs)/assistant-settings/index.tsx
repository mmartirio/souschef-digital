import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { listVoices, speak, stopSpeaking } from '../../../lib/speech';
import { COLORS, SIZES } from '../../../lib/constants';
import { PHRASES } from '../../../lib/voicePhrases';
import { useVoiceSettings, VOICE_OPTIONS } from '../../../lib/voiceSettings';

export default function AssistantSettingsScreen() {
  const router = useRouter();
  const { voiceId, setVoice } = useVoiceSettings();
  const [installed, setInstalled] = useState<Set<string> | null>(null);

  useEffect(() => {
    listVoices()
      .then((voices) => setInstalled(new Set(voices.map((v) => v.identifier))))
      .catch(() => setInstalled(new Set()));
  }, []);

  // A voz padrão (null) sempre existe; as demais dependem do que o celular tem instalado.
  const isAvailable = (id: string | null) =>
    id === null || installed === null || installed.has(`${id}-network`) || installed.has(`${id}-local`);

  const preview = (id: string | null) => {
    void stopSpeaking();
    void speak(PHRASES.sample, id);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionTitle}>Voz do assistente</Text>
        <Text style={styles.hint}>Toque em ▶ para ouvir cada voz.</Text>
        {VOICE_OPTIONS.map((option) => {
          const available = isAvailable(option.voiceId);
          return (
            <TouchableOpacity
              key={option.label}
              style={[styles.option, !available && styles.unavailable]}
              onPress={() => setVoice(option.voiceId)}
              disabled={!available}
              accessibilityState={{ selected: option.voiceId === voiceId, disabled: !available }}
            >
              <Ionicons
                name={option.voiceId === voiceId ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={option.voiceId === voiceId ? COLORS.secondary : COLORS.textSecondary}
              />
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                {!available && <Text style={styles.optionDetail}>Não instalada neste celular</Text>}
              </View>
              {available && (
                <TouchableOpacity onPress={() => preview(option.voiceId)} hitSlop={10} accessibilityLabel={`Ouvir voz ${option.label}`}>
                  <Ionicons name="play-circle-outline" size={28} color={COLORS.text} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </Card>

      <Button title="CONVERSAR COM O SOUSCHEF" icon="mic" onPress={() => router.push('/ai-assistant')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, gap: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  hint: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  unavailable: { opacity: 0.5 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 15, color: COLORS.text },
  optionDetail: { fontSize: 12, color: COLORS.textSecondary },
});
