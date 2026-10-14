import { useCallback, useEffect, useRef } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

const OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };
const SPEECH_DB = -45; // acima disso consideramos voz
const SILENCE_MS = 1500; // silêncio após falar encerra a gravação
const NO_SPEECH_MS = 7000; // desiste se ninguém falar
const MAX_MS = 15000; // gravação mais longa permitida
const SAFETY_MS = MAX_MS + 2000; // encerra mesmo se o status do gravador parar de chegar

/** Microfone negado: a conversa não tem como continuar. */
export class MicrophonePermissionError extends Error {
  constructor() {
    super('Permita o acesso ao microfone para falar com o assistente.');
  }
}

/**
 * Gravação de voz com parada automática por silêncio (VAD por metering).
 * `listen()` sempre resolve: com a URI do áudio, ou null se nada foi dito / foi cancelado.
 */
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(OPTIONS);
  const state = useAudioRecorderState(recorder, 150);
  const resolver = useRef<((uri: string | null) => void) | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const vad = useRef({ heardSpeech: false, lastSoundAt: 0, startedAt: 0 });

  const finish = useCallback(
    async (keepAudio: boolean) => {
      if (!resolver.current) return;
      const resolve = resolver.current;
      resolver.current = null;
      clearTimeout(safetyTimer.current);
      // Parar pode falhar (ex.: gravação já encerrada pelo sistema); a escuta termina de qualquer jeito.
      try {
        if (recorder.isRecording) await recorder.stop();
      } catch {}
      try {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      } catch {}
      resolve(keepAudio ? recorder.uri : null);
    },
    [recorder],
  );

  const listen = useCallback(async (): Promise<string | null> => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) throw new MicrophonePermissionError();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    const now = Date.now();
    vad.current = { heardSpeech: false, lastSoundAt: now, startedAt: now };
    safetyTimer.current = setTimeout(() => void finish(true), SAFETY_MS);
    return new Promise((resolve) => (resolver.current = resolve));
  }, [recorder, finish]);

  useEffect(() => {
    if (!state.isRecording || !resolver.current) return;
    const now = Date.now();
    const v = vad.current;
    const elapsed = now - v.startedAt;

    if (elapsed > MAX_MS) return void finish(true);
    if (state.metering === undefined) return; // plataforma sem metering: encerra pelo tempo máximo

    if (state.metering > SPEECH_DB) {
      v.heardSpeech = true;
      v.lastSoundAt = now;
    }
    if (v.heardSpeech && now - v.lastSoundAt > SILENCE_MS) void finish(true);
    else if (!v.heardSpeech && elapsed > NO_SPEECH_MS) void finish(false);
  }, [state, finish]);

  useEffect(() => () => void finish(false), [finish]);

  return {
    listen,
    stop: () => finish(true), // parada manual: envia o que foi gravado
    cancel: () => finish(false),
    isRecording: state.isRecording,
    level: state.metering,
  };
}
