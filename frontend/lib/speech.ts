import * as Speech from 'expo-speech';
import { toSpeech } from './recipeSpeech';
import { VOICE_LANGUAGE } from './voicePhrases';

let lastSpoken = '';

const plain = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * O microfone captou a própria voz do assistente? Trechos de 3+ palavras que ele acabou de falar
 * são eco; comandos curtos do usuário ("pronto", "repete") nunca são descartados.
 */
export function isEcho(heard: string): boolean {
  const words = plain(heard);
  return words.split(' ').length >= 3 && lastSpoken.includes(words);
}

/** Fala o texto em pt-BR no padrão de leitura do app (com a voz escolhida) e resolve quando termina. */
export function speak(text: string, voiceId: string | null = null): Promise<void> {
  const spoken = toSpeech(text);
  lastSpoken = plain(spoken);
  return new Promise((resolve) => {
    Speech.speak(spoken, {
      language: VOICE_LANGUAGE,
      voice: voiceId ?? undefined,
      rate: 0.95,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export const stopSpeaking = () => Speech.stop();

/** Vozes pt-BR instaladas no aparelho ("pt-BR" ou "pt_BR"). */
export async function listVoices(): Promise<Speech.Voice[]> {
  const target = VOICE_LANGUAGE.toLowerCase();
  const voices = await Speech.getAvailableVoicesAsync();
  return voices
    .filter((voice) => voice.language.toLowerCase().replace('_', '-') === target)
    .sort((a, b) => a.name.localeCompare(b.name));
}
