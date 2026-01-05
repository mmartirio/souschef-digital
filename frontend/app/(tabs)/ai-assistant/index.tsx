import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { COLORS, SIZES, API_URL } from '../../../lib/constants';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou seu assistente culinário. Como posso ajudar você hoje? Posso sugerir receitas, dar dicas de culinária ou ajudar com substituições de ingredientes!',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Configurar permissões de áudio
  useEffect(() => {
    (async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (err) {
        console.error('Erro ao solicitar permissões de áudio:', err);
      }
    })();
  }, []);

  const startRecording = async () => {
    try {
      const { granted } = await Audio.getPermissionsAsync();
      if (!granted) {
        Alert.alert('Permissão negada', 'É necessário permitir o acesso ao microfone para usar o reconhecimento de voz.');
        return;
      }

      setIsRecording(true);
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Erro ao iniciar gravação:', err);
      Alert.alert('Erro', 'Não foi possível iniciar a gravação de voz.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        Alert.alert('Erro', 'Não foi possível obter o áudio gravado.');
        return;
      }

      // Enviar áudio para transcrição
      setLoading(true);
      
      try {
        const formData = new FormData();
        formData.append('audio', {
          uri: uri,
          type: 'audio/wav',
          name: 'recording.wav',
        } as any);

        const response = await fetch(`${API_URL}/ai/transcribe`, {
          method: 'POST',
          body: formData,
          headers: {
            // Token de autenticação será adicionado aqui
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao transcrever áudio');
        }

        const data = await response.json();
        const transcribedText = data.text;

        // Adicionar mensagem do usuário com o texto transcrito
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: transcribedText,
        };

        setMessages(prev => [...prev, userMessage]);

        // Enviar para o assistente IA
        setTimeout(() => {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Ouvi você dizer: "' + transcribedText + '". O assistente IA ainda não está totalmente configurado, mas a transcrição de voz está funcionando!',
          };
          setMessages(prev => [...prev, aiMessage]);
          setLoading(false);
        }, 1000);

      } catch (error) {
        console.error('Erro na transcrição:', error);
        Alert.alert('Erro', 'Não foi possível transcrever o áudio. Verifique se o backend está rodando.');
        setLoading(false);
      }

    } catch (err) {
      console.error('Erro ao parar gravação:', err);
      Alert.alert('Erro', 'Não foi possível parar a gravação.');
      setLoading(false);
    }
  };

  const speakMessage = (text: string) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    Speech.speak(text, {
      language: 'pt-BR',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        Alert.alert('Erro', 'Não foi possível reproduzir o áudio.');
      },
    });
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // TODO: Implementar chamada real à API
      // Simulação de resposta
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Desculpe, o assistente IA ainda não está configurado. Por favor, configure o Ollama no backend para usar esta funcionalidade.',
        };
        setMessages(prev => [...prev, aiMessage]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setLoading(false);
    }
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageBubble,
        message.role === 'user' ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      {message.role === 'assistant' && (
        <View style={styles.avatarContainer}>
          <Ionicons name="restaurant" size={20} color={COLORS.secondary} />
        </View>
      )}
      <View style={styles.messageWrapper}>
        <View
          style={[
            styles.messageContent,
            message.role === 'user' ? styles.userContent : styles.assistantContent,
          ]}
        >
          <Text style={styles.messageText}>{message.content}</Text>
        </View>
        {message.role === 'assistant' && (
          <TouchableOpacity
            style={styles.speakButton}
            onPress={() => speakMessage(message.content)}
          >
            <Ionicons 
              name={isSpeaking ? "stop-circle" : "volume-high"} 
              size={20} 
              color={COLORS.primary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(renderMessage)}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.secondary} />
            <Text style={styles.loadingText}>Pensando...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[
            styles.micButton,
            isRecording && styles.micButtonActive,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Ionicons
            name={isRecording ? "stop-circle" : "mic"}
            size={24}
            color={isRecording ? COLORS.error : COLORS.primary}
          />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={COLORS.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || loading) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Ionicons
            name="send"
            size={24}
            color={inputText.trim() && !loading ? COLORS.background : COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: SIZES.padding,
    paddingBottom: 20,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  messageContent: {
    padding: 12,
    borderRadius: SIZES.radius,
    flex: 1,
  },
  userContent: {
    backgroundColor: COLORS.text,
  },
  assistantContent: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.background,
  },
  assistantText: {
    color: COLORS.text,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  micButtonActive: {
    backgroundColor: '#ffebee',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 16,
    color: COLORS.text,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.cardBg,
  },
  speakButton: {
    marginLeft: 8,
    padding: 4,
  },
});
