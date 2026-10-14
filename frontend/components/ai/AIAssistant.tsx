import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ChatBubble from './ChatBubble';
import VoiceButton from './VoiceButton';
import { useVoiceAgent, VoiceAgent } from '../../hooks/useVoiceAgent';
import { aiAPI } from '../../lib/api';
import { COLORS, SIZES } from '../../lib/constants';
import { normalize, PHRASES, RECIPE_REQUEST } from '../../lib/voicePhrases';

interface Props {
  /** Quando muda, começa a ouvir (ex.: microfone da home). */
  listenKey?: string;
}

export default function AIAssistant({ listenKey }: Props) {
  const router = useRouter();
  const agentRef = useRef<VoiceAgent | null>(null);

  /**
   * Pedido de receita ("quero fazer brigadeiro"): avisa que vai procurar enquanto busca e abre a
   * receita cadastrada no modo guiado, que a lê como está escrita. Pedido ambíguo recebe as opções
   * do livro de receitas; a IA nunca inventa uma receita.
   */
  const onCommand = useCallback(
    async (text: string) => {
      const agent = agentRef.current;
      if (!agent) return false;
      const explicit = RECIPE_REQUEST.test(normalize(text));
      // Perguntas sem pedido explícito ("qual o segredo do hambúrguer?") vão para a IA.
      if (!explicit && text.trim().endsWith('?')) return false;

      // Pedido explícito: a vinheta "vou procurar" toca antes de qualquer resposta (só falada, fora
      // do chat) enquanto a busca roda; só o nome ("brigadeiro") busca em silêncio.
      const [search] = await Promise.all([
        aiAPI.findRecipe(text).catch(() => null),
        explicit ? agent.speak(PHRASES.searchingRecipe) : undefined,
      ]);
      const match = search?.match;
      if (!match && !explicit) return false;
      if (!match) {
        const options = search?.options.map((option) => option.title) ?? [];
        await agent.reply(options.length ? PHRASES.recipeOptions(options) : PHRASES.recipeNotFound);
        return true;
      }
      await agent.reply(PHRASES.foundRecipe);
      agent.cancel(); // o modo guiado assume o microfone
      router.push({ pathname: '/recipes/[id]', params: { id: String(match.id), guided: String(Date.now()) } });
      return true;
    },
    [router],
  );

  const agent = useVoiceAgent({ onCommand });
  agentRef.current = agent;
  const [input, setInput] = useState('');
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    if (listenKey) void agent.talk(true);
  }, [listenKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (agent.error) Alert.alert('Assistente', agent.error);
  }, [agent.error]);

  const toggleConversation = () => (agent.status === 'idle' ? agent.talk(true) : agent.cancel());

  const send = () => {
    const text = input.trim();
    if (!text || agent.busy) return;
    setInput('');
    void agent.sendText(text);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        <ChatBubble message={{ role: 'assistant', content: PHRASES.greeting }} onSpeak={agent.speak} />
        {agent.messages.map((message, index) => (
          <ChatBubble key={index} message={message} onSpeak={agent.speak} />
        ))}
      </ScrollView>

      <View style={styles.voice}>
        <VoiceButton status={agent.status} onPress={toggleConversation} />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={COLORS.textSecondary}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.send, (!input.trim() || agent.busy) && styles.sendDisabled]}
          onPress={send}
          disabled={!input.trim() || agent.busy}
        >
          <Ionicons name="send" size={20} color={COLORS.background} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  messages: { padding: SIZES.padding },
  voice: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: SIZES.padding, paddingTop: 0 },
  input: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: { opacity: 0.3 },
});
