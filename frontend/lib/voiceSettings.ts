import { createContext, createElement, ReactNode, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'voice_id';

export interface VoiceOption {
  label: string;
  /** Identificador da voz do sistema; null = voz padrão do aparelho. */
  voiceId: string | null;
}

/** Vozes oferecidas ao usuário. */
export const VOICE_OPTIONS: VoiceOption[] = [
  { label: 'Feminina (padrão do sistema)', voiceId: null },
  { label: 'Masculina', voiceId: 'pt-br-x-ptd-local' },
];

const isOffered = (id: string | null) => VOICE_OPTIONS.some((option) => option.voiceId === id);

interface VoiceSettingsState {
  /** Identificador da voz do sistema; null = voz padrão. */
  voiceId: string | null;
  setVoice: (voiceId: string | null) => void;
}

const VoiceSettingsContext = createContext<VoiceSettingsState | null>(null);

export function VoiceSettingsProvider({ children }: { children: ReactNode }) {
  const [voiceId, setVoiceId] = useState<string | null>(null);

  useEffect(() => {
    // Voz salva que não é mais oferecida volta para a padrão.
    AsyncStorage.getItem(STORAGE_KEY)
      .then((id) => setVoiceId(isOffered(id) ? id : null))
      .catch(() => undefined);
  }, []);

  const setVoice = (id: string | null) => {
    setVoiceId(id);
    void (id ? AsyncStorage.setItem(STORAGE_KEY, id) : AsyncStorage.removeItem(STORAGE_KEY));
  };

  return createElement(VoiceSettingsContext.Provider, { value: { voiceId, setVoice } }, children);
}

export function useVoiceSettings(): VoiceSettingsState {
  const context = useContext(VoiceSettingsContext);
  if (!context) throw new Error('useVoiceSettings deve ser usado dentro de <VoiceSettingsProvider>');
  return context;
}
