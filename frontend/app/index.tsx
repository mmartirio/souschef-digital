import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS, SIZES, API_URL } from '../lib/constants';

export default function Index() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedText, setDisplayedText] = useState('O QUE VOCÊ VAI COZINHAR HOJE?');
  const fullText = 'O QUE VOCÊ VAI COZINHAR HOJE?';
  const animatedOpacity = new Animated.Value(1);
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const startAnimation = () => {
      setDisplayedText('');
      
      // Desaparece
      Animated.timing(animatedOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start(() => {
        // Aparece e digita letra por letra
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();

        // Digita letra por letra
        let letterIndex = 0;
        const typeInterval = setInterval(() => {
          if (letterIndex <= fullText.length) {
            setDisplayedText(fullText.substring(0, letterIndex));
            letterIndex++;
          } else {
            clearInterval(typeInterval);
          }
        }, 80);
      });
    };

    const interval = setInterval(startAnimation, 10000);
    return () => clearInterval(interval);
  }, []);

  // Atualiza token do Supabase para autenticar no backend
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthToken(data.session?.access_token ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthToken(session?.access_token ?? null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const animatedStyle = {
    opacity: animatedOpacity,
  };

  const handleSendMessage = async (message?: string) => {
    const content = (message ?? userInput).trim();
    if (!content) return;

    const newMessage = { role: 'user' as const, content };
    setChatMessages(prev => [...prev, newMessage]);
    setUserInput('');
    setIsLoadingAI(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: content, context: 'receita' }),
      });

      if (!response.ok) {
        console.error('Chat API falhou', response.status, await response.text());
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Não consegui responder agora. Tente novamente.' }]);
        return;
      }

      const data = await response.json();
      const reply = data.response || data.message || 'Tudo certo. Mais detalhes?';
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro.' }]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Autorize o microfone para falar com o assistente.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setShowAIChat(true);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);
      setRecording(null);

      if (!uri) return;

      const formData = new FormData();
      const fileType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/3gpp';
      const fileName = Platform.OS === 'ios' ? 'voice.m4a' : 'voice.3gp';
      formData.append('file', {
        uri,
        name: fileName,
        type: fileType,
      } as any);

      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch(`${API_URL}/ai/transcribe`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        console.error('Transcribe falhou', response.status, await response.text());
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Não consegui ouvir. Tente novamente.' }]);
        return;
      }

      const data = await response.json();
      const transcript = data.text || data.transcript || '';
      if (transcript) {
        setUserInput(transcript);
        handleSendMessage(transcript);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Não entendi o áudio. Pode repetir?' }]);
      }
    } catch (error) {
      console.error('Erro ao finalizar gravação:', error);
      setIsRecording(false);
    }
  };

  const handleVoiceSearch = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/(tabs)/recipes?search=${searchQuery}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={28} color={COLORS.text} />
          </TouchableOpacity>

          <Image
            source={require('../assets/icon.png')}
            style={styles.logoContainer}
            resizeMode="contain"
          />

          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Image
              source={require('../assets/user.png')}
              style={styles.profileAvatar}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons 
              name="search" 
              size={15} 
              color={COLORS.textSecondary} 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar receitas..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity 
            style={styles.micButton}
            onPress={handleVoiceSearch}
          >
            <Ionicons 
              name={isRecording ? 'mic-off' : 'mic'} 
              size={28} 
              color={isRecording ? COLORS.primary || '#FF6B35' : COLORS.text} 
            />
          </TouchableOpacity>

          {isRecording && (
            <View style={styles.recordingBadge}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Gravando... toque no mic para parar</Text>
            </View>
          )}

          <Animated.Text style={[styles.mainTitle, animatedStyle]}>
            {displayedText}
          </Animated.Text>
        </View>

        {showAIChat && (
          <View style={styles.aiChatContainer}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Assistente de Receitas</Text>
              <TouchableOpacity onPress={() => setShowAIChat(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.chatMessages}>
              {chatMessages.length === 0 ? (
                <View style={styles.emptyChat}>
                  <Text style={styles.emptyChatText}>Como posso ajudar você a encontrar uma receita?</Text>
                </View>
              ) : (
                chatMessages.map((msg, index) => (
                  <View key={index} style={[
                    styles.messageBubble,
                    msg.role === 'user' ? styles.userMessage : styles.assistantMessage
                  ]}>
                    <Text style={[
                      styles.messageText,
                      msg.role === 'user' ? styles.userMessageText : styles.assistantMessageText
                    ]}>
                      {msg.content}
                    </Text>
                  </View>
                ))
              )}
              {isLoadingAI && (
                <View style={styles.messageBubble}>
                  <Text style={styles.loadingText}>Digitando...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Digite sua solicitação..."
                placeholderTextColor={COLORS.textSecondary}
                value={userInput}
                onChangeText={setUserInput}
                multiline
                editable={!isLoadingAI}
              />
              <TouchableOpacity 
                style={[styles.sendButton, isLoadingAI && styles.sendButtonDisabled]}
                onPress={() => handleSendMessage()}
                disabled={isLoadingAI}
              >
                <Ionicons name="send" size={20} color={COLORS.background} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Hero Image */}
        <View style={styles.heroImageContainer}>
          <Image
            source={require('../assets/HeroImage.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* Quick Access Section */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>ACESSO RÁPIDO</Text>
          
          <View style={styles.quickAccessButtons}>
            <TouchableOpacity 
              style={styles.quickButton}
              onPress={() => router.push('/(tabs)/recipes')}
            >
              <Ionicons name="restaurant-outline" size={16} color={COLORS.text} />
              <Text style={styles.quickButtonText}>RECEITAS</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickButton}
              onPress={() => router.push('/(tabs)/recipes')} // TODO: Criar tela de favoritos
            >
              <Ionicons name="star-outline" size={16} color={COLORS.text} />
              <Text style={styles.quickButtonText}>FAVORITOS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
  },
  menuButton: {
    padding: 8,
  },
  logoContainer: {
    width: 150,
    height: 90,
    top: 40,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 3,
  },
  profileButton: {
    padding: 8,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchSection: {
    flexDirection: 'column',
    paddingHorizontal: SIZES.padding,
    marginTop: 16,
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
  },
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary || '#FF6B35',
  },
  recordingText: {
    fontSize: 12,
    color: COLORS.text,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
    paddingHorizontal: SIZES.padding,
  },
  heroImageContainer: {
    marginHorizontal: 0,
    marginBottom: 32,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  heroImage: {
    width: '100%',
    height: 240,
  },
  sectionDivider: {
    height: 2,
    marginHorizontal: SIZES.padding,
    marginBottom: 24,
    backgroundColor: COLORS.border,
  },
  quickAccessSection: {
    paddingHorizontal: SIZES.padding,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    letterSpacing: 1,
    textAlign: 'center',
  },
  quickAccessButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  quickButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.text,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  quickButtonText: {
    marginTop: 0,
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 1,
  },
  categoriesSection: {
    paddingHorizontal: SIZES.padding,
    marginBottom: 32,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radius,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  aiChatContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '30%',
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'column',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 1000,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 16,
  },
  emptyChat: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChatText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  messageBubble: {
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary || '#FF6B35',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  userMessageText: {
    color: '#FFF',
  },
  assistantMessageText: {
    color: COLORS.text,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 13,
    color: COLORS.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary || '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
