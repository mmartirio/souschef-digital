import { useCallback, useEffect, useRef, useState } from 'react';
import { aiAPI, errorMessage } from '../lib/api';
import { isEcho, speak, stopSpeaking } from '../lib/speech';
import type { ChatMessage } from '../lib/types';
import { GOODBYE, normalize, PHRASES } from '../lib/voicePhrases';
import { useVoiceSettings } from '../lib/voiceSettings';
import { MicrophonePermissionError, useVoiceRecorder } from './useVoiceRecorder';

export type AgentStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

const RETRY_DELAY_MS = 1000; // espera antes de voltar a ouvir após um erro momentâneo
const ECHO_GUARD_MS = 500; // pausa entre falar e ouvir, para o microfone não captar a própria voz
const MAX_MISSES = 3; // tentativas seguidas sem entender antes de parar de ouvir

interface Options {
  recipeId?: number;
  /** Intercepta comandos (ex.: "próximo", pedido de receita). Retorne true se tratou o texto. */
  onCommand?: (text: string) => boolean | Promise<boolean>;
  /** Dita (com a voz escolhida) assim que a fala do usuário é captada, enquanto ela é transcrita. */
  heardPhrase?: string;
  /** Sem fala ou sem entender: avisa ("não entendi") e volta a ouvir, até MAX_MISSES vezes seguidas. */
  retryOnMiss?: boolean;
}

/**
 * Agente de conversação com a voz escolhida. Fala e texto digitado seguem o mesmo caminho:
 * comandos → despedida → IA. Em modo contínuo, volta a ouvir após cada resposta.
 */
export function useVoiceAgent({ recipeId, onCommand, heardPhrase, retryOnMiss }: Options = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const recorder = useVoiceRecorder();
  const { voiceId } = useVoiceSettings();

  const messagesRef = useRef(messages);
  /** Identifica a conversa ativa; incrementar encerra a atual. */
  const conversation = useRef(0);
  const mounted = useRef(true);
  useEffect(() => () => {
    mounted.current = false;
    stopSpeaking();
  }, []);

  /** Encerra a conversa em andamento (a rodada atual termina e o loop não recomeça). */
  const endConversation = () => {
    conversation.current += 1;
  };

  const say = useCallback((text: string) => speak(text, voiceId), [voiceId]);

  const addMessage = (message: ChatMessage) => {
    messagesRef.current = [...messagesRef.current, message];
    setMessages(messagesRef.current);
  };

  /** Resposta do próprio app (não da IA): aparece no chat e é falada. */
  const reply = useCallback(
    async (text: string) => {
      addMessage({ role: 'assistant', content: text });
      setStatus('speaking');
      await say(text);
      if (mounted.current) setStatus('idle');
    },
    [say],
  );

  /** Pergunta à IA com o histórico atual (a mensagem do usuário já foi registrada). */
  const ask = useCallback(
    async (speakReply: boolean) => {
      setStatus('thinking');
      let answer: string;
      try {
        answer = await aiAPI.chat(messagesRef.current, recipeId);
      } catch (e) {
        answer = errorMessage(e, PHRASES.chatError);
      }
      addMessage({ role: 'assistant', content: answer });
      if (speakReply) {
        setStatus('speaking');
        await say(answer);
      }
      setStatus('idle');
    },
    [recipeId, say],
  );

  /** Trata o que o usuário falou ou digitou: comandos, despedida e, por fim, a IA. */
  const handle = useCallback(
    async (text: string, { speakReply, continuous }: { speakReply: boolean; continuous: boolean }) => {
      addMessage({ role: 'user', content: text });
      if (onCommand && (await onCommand(text))) return;
      if (continuous && GOODBYE.test(normalize(text))) {
        endConversation();
        await reply(PHRASES.goodbyeReply);
        return;
      }
      await ask(speakReply);
    },
    [onCommand, reply, ask],
  );

  /** Uma rodada de voz: ouve, transcreve e trata. Retorna false se nada foi dito ou entendido. */
  const listenOnce = useCallback(
    async (continuous: boolean): Promise<boolean> => {
      await new Promise((resolve) => setTimeout(resolve, ECHO_GUARD_MS));
      setStatus('listening');
      const uri = await recorder.listen();
      if (!uri) return false;

      setStatus('thinking');
      const heard = heardPhrase ? say(heardPhrase) : undefined;
      let text = '';
      try {
        text = (await aiAPI.transcribe(uri)).trim();
      } catch {
        // falha na transcrição conta como "não entendi"
      } finally {
        await heard; // a resposta (ou a próxima escuta) só começa depois dessa fala
      }
      if (!text) return false;
      if (isEcho(text)) return true; // eco da própria voz: ignora em silêncio
      await handle(text, { speakReply: true, continuous });
      return true;
    },
    [recorder, handle, heardPhrase, say],
  );

  /**
   * continuous=true: conversa até o usuário encerrar (toque, "tchau" ou sair da tela).
   * Erros momentâneos (rede, transcrição) não derrubam a conversa; só a falta de microfone.
   */
  const talk = useCallback(
    async (continuous = false) => {
      stopSpeaking();
      setError(null);
      const id = ++conversation.current;
      const active = () => conversation.current === id && mounted.current;
      let misses = 0;
      try {
        do {
          try {
            const understood = await listenOnce(continuous);
            misses = understood ? 0 : misses + 1;
            if (!understood && retryOnMiss && active()) {
              setStatus('speaking');
              if (misses >= MAX_MISSES) {
                await say(PHRASES.tooManyMisses);
                break;
              }
              await say(PHRASES.notUnderstood);
            }
          } catch (e) {
            if (!continuous || e instanceof MicrophonePermissionError) throw e;
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          }
        } while (continuous && active());
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        if (conversation.current === id) endConversation();
        // Só volta a "parado" se nenhuma conversa nova começou nesse meio-tempo.
        const startedAnother = conversation.current > id + 1;
        if (mounted.current && !startedAnother) setStatus('idle');
      }
    },
    [listenOnce, retryOnMiss, say],
  );

  const cancel = useCallback(() => {
    endConversation();
    stopSpeaking();
    void recorder.cancel();
  }, [recorder]);

  return {
    messages,
    status,
    error,
    busy: status !== 'idle',
    level: recorder.level,
    talk,
    /** Encerra a conversa: descarta a gravação e interrompe a fala. */
    cancel,
    /** Texto digitado: mesmo tratamento da voz; a resposta da IA aparece no chat sem ser falada. */
    sendText: (text: string) => handle(text, { speakReply: false, continuous: false }),
    /** Fala e registra no chat uma resposta do app. */
    reply,
    /** Só fala (ex.: ouvir de novo uma mensagem do chat). */
    speak: async (text: string) => {
      setStatus('speaking');
      await say(text);
      if (mounted.current) setStatus('idle');
    },
  };
}

/** Tipo do objeto retornado por useVoiceAgent (para guardar em refs). */
export type VoiceAgent = ReturnType<typeof useVoiceAgent>;
