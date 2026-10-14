import { createContext, createElement, ReactNode, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'voice_id';
const SYSTEM_VOICE = 'system'; // valor salvo para a voz padrão do aparelho (null)

export interface VoiceOption {
  label: string;
  /** Voz do Google sem o sufixo -network/-local (ver resolveVoice); null = voz padrão do aparelho. */
  voiceId: string | null;
}

/** Vozes oferecidas ao usuário. */
export const VOICE_OPTIONS: VoiceOption[] = [
  { label: 'Feminina', voiceId: 'pt-br-x-afs' },
  { label: 'Masculina', voiceId: 'pt-br-x-ptd' },
  { label: 'Padrão do sistema', voiceId: null },
];

const DEFAULT_VOICE = VOICE_OPTIONS[0].voiceId;

/** Voz salva → opção oferecida (versões antigas guardavam o id com sufixo, ex.: "pt-br-x-ptd-local"). */
const toOffered = (id: string) => {
  if (id === SYSTEM_VOICE) return null;
  const voice = id.replace(/-(network|local)$/, '');
  return VOICE_OPTIONS.some((option) => option.voiceId === voice) ? voice : DEFAULT_VOICE;
};

interface VoiceSettingsState {
  /** Identificador da voz do sistema; null = voz padrão. */
  voiceId: string | null;
  setVoice: (voiceId: string | null) => void;
}

const VoiceSettingsContext = createContext<VoiceSettingsState | null>(null);

export function VoiceSettingsProvider({ children }: { children: ReactNode }) {
  const [voiceId, setVoiceId] = useState<string | null>(DEFAULT_VOICE);

  useEffect(() => {
    // Voz salva que não é mais oferecida volta para a padrão.
    AsyncStorage.getItem(STORAGE_KEY)
      .then((id) => id !== null && setVoiceId(toOffered(id)))
      .catch(() => undefined);
  }, []);

  const setVoice = (id: string | null) => {
    setVoiceId(id);
    void AsyncStorage.setItem(STORAGE_KEY, id ?? SYSTEM_VOICE);
  };

  return createElement(VoiceSettingsContext.Provider, { value: { voiceId, setVoice } }, children);
}

export function useVoiceSettings(): VoiceSettingsState {
  const context = useContext(VoiceSettingsContext);
  if (!context) throw new Error('useVoiceSettings deve ser usado dentro de <VoiceSettingsProvider>');
  return context;
}
