import * as Speech from 'expo-speech';
import { toSpeech } from './recipeSpeech';
import { VOICE_LANGUAGE } from './voicePhrases';

let lastSpoken = '';

const plain = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * O microfone captou a própria voz do assistente? Eco é o fim da última fala ou boa parte dela.
 * Comandos curtos ("pronto", "repete") e trechos do meio da fala (ex.: o nome de uma das receitas
 * oferecidas) são respostas do usuário e nunca são descartados.
 */
export function isEcho(heard: string): boolean {
  const words = plain(heard);
  const count = words.split(' ').length;
  if (count < 3 || !lastSpoken.includes(words)) return false;
  return lastSpoken.endsWith(words) || count >= lastSpoken.split(' ').length * 0.6;
}

let installedIds: Promise<Set<string>> | null = null;
const installed = () =>
  (installedIds ??= listVoices()
    .then((voices) => new Set(voices.map((voice) => voice.identifier)))
    .catch(() => new Set<string>()));

/**
 * Variante instalada de uma voz do Google ("pt-br-x-ptd"): a de rede é neural e bem mais natural
 * (sem internet, o próprio Android cai na local); sem nenhuma, usa a voz padrão do aparelho.
 */
export async function resolveVoice(voice: string | null): Promise<string | null> {
  if (!voice) return null;
  const ids = await installed();
  return [`${voice}-network`, `${voice}-local`].find((id) => ids.has(id)) ?? null;
}

/** Fala o texto em pt-BR no padrão de leitura do app (com a voz escolhida) e resolve quando termina. */
export async function speak(text: string, voice: string | null = null): Promise<void> {
  const spoken = toSpeech(text);
  lastSpoken = plain(spoken);
  const voiceId = await resolveVoice(voice);
  return new Promise((resolve) => {
    Speech.speak(spoken, {
      language: VOICE_LANGUAGE,
      voice: voiceId ?? undefined,
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
