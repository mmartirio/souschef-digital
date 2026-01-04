import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { COLORS, SIZES } from '../../lib/constants';

interface GuidedRecipeProps {
  recipeId: number;
  recipeName: string;
  onClose: () => void;
}

interface Step {
  index: number;
  text: string;
  completed: boolean;
}

export default function GuidedRecipeMode({ recipeId, recipeName, onClose }: GuidedRecipeProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [listeningForNext, setListeningForNext] = useState(false);

  // Carregar passos da receita
  useEffect(() => {
    loadRecipeSteps();
  }, [recipeId]);

  // Reproduzir passo atual automaticamente
  useEffect(() => {
    if (steps.length > 0 && !loading) {
      speakCurrentStep();
    }
  }, [currentStepIndex, steps]);

  const loadRecipeSteps = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://192.168.0.15:8000/api/ai/recipes/${recipeId}/steps`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar passos');
      }

      const data = await response.json();
      
      // Converter passos em objetos com estado
      const formattedSteps = data.steps.map((text: string, index: number) => ({
        index,
        text,
        completed: false,
      }));

      setSteps(formattedSteps);
      setCurrentStepIndex(0);
    } catch (error) {
      console.error('Erro:', error);
      Alert.alert('Erro', 'Não foi possível carregar os passos da receita');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const speakCurrentStep = () => {
    if (steps.length === 0) return;

    const currentStep = steps[currentStepIndex];
    const stepNumber = currentStepIndex + 1;
    const totalSteps = steps.length;

    const textToSpeak = `Passo ${stepNumber} de ${totalSteps}. ${currentStep.text}`;

    setIsSpeaking(true);
    
    Speech.speak(textToSpeak, {
      language: 'pt-BR',
      pitch: 1.0,
      rate: 0.85,
      onDone: () => {
        setIsSpeaking(false);
        // Aguardar o usuário dizer próximo
        startListeningForNext();
      },
      onStopped: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        Alert.alert('Erro', 'Não foi possível reproduzir o áudio');
      },
    });
  };

  const startListeningForNext = () => {
    // TODO: Implementar reconhecimento de voz para "próximo"
    // Por enquanto, usar botão
    setListeningForNext(true);
  };

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      // Marcar passo atual como completo
      const updatedSteps = [...steps];
      updatedSteps[currentStepIndex].completed = true;
      setSteps(updatedSteps);

      // Ir para próximo
      setCurrentStepIndex(currentStepIndex + 1);
      setListeningForNext(false);
    } else {
      // Última etapa
      completedRecipe();
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setListeningForNext(false);
    }
  };

  const completedRecipe = () => {
    Speech.speak('Parabéns! Você concluiu a receita!', {
      language: 'pt-BR',
    });
    
    setTimeout(() => {
      Alert.alert(
        'Receita Concluída! 🎉',
        'Você terminou de preparar a receita. Bom apetite!',
        [{ text: 'OK', onPress: onClose }]
      );
    }, 500);
  };

  const stopSpeaking = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    }
  };

  const repeatStep = () => {
    speakCurrentStep();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (steps.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Nenhum passo encontrado</Text>
      </View>
    );
  }

  const currentStep = steps[currentStepIndex];
  const stepNumber = currentStepIndex + 1;
  const totalSteps = steps.length;
  const progress = (stepNumber / totalSteps) * 100;

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.recipeName}>{recipeName}</Text>
        <Text style={styles.stepCounter}>
          {stepNumber}/{totalSteps}
        </Text>
      </View>

      {/* Barra de progresso */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${progress}%` },
          ]}
        />
      </View>

      {/* Conteúdo do passo */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Número do passo */}
        <View style={styles.stepNumberContainer}>
          <Text style={styles.stepNumber}>Passo {stepNumber}</Text>
        </View>

        {/* Texto do passo */}
        <View style={styles.stepTextContainer}>
          <Ionicons
            name={isSpeaking ? "volume-high" : "chatbubble-ellipses"}
            size={24}
            color={COLORS.primary}
            style={{ marginBottom: 12 }}
          />
          <Text style={styles.stepText}>{currentStep.text}</Text>
        </View>

        {/* Lista de passos completados */}
        <View style={styles.completedStepsContainer}>
          <Text style={styles.completedStepsTitle}>Progresso:</Text>
          {steps.map((step, index) => (
            <View key={index} style={styles.completedStepItem}>
              <Ionicons
                name={step.completed ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={step.completed ? COLORS.success : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.completedStepText,
                  index === currentStepIndex && styles.currentStepHighlight,
                  step.completed && styles.completedStepText,
                ]}
              >
                Passo {index + 1}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Controles */}
      <View style={styles.controls}>
        {/* Botão repetir */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={repeatStep}
          disabled={isSpeaking}
        >
          <Ionicons
            name="repeat"
            size={24}
            color={isSpeaking ? COLORS.textSecondary : COLORS.primary}
          />
          <Text style={styles.controlLabel}>Repetir</Text>
        </TouchableOpacity>

        {/* Botão anterior */}
        <TouchableOpacity
          style={[styles.controlButton, currentStepIndex === 0 && styles.disabledButton]}
          onPress={goToPreviousStep}
          disabled={currentStepIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentStepIndex === 0 ? COLORS.textSecondary : COLORS.primary}
          />
          <Text style={styles.controlLabel}>Anterior</Text>
        </TouchableOpacity>

        {/* Botão próximo */}
        <TouchableOpacity
          style={[styles.controlButton, styles.nextButton]}
          onPress={goToNextStep}
        >
          <Ionicons
            name={stepNumber === totalSteps ? "checkmark" : "chevron-forward"}
            size={24}
            color={COLORS.background}
          />
          <Text style={[styles.controlLabel, { color: COLORS.background }]}>
            {stepNumber === totalSteps ? 'Finalizar' : 'Próximo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status de escuta */}
      {listeningForNext && (
        <View style={styles.listeningIndicator}>
          <Ionicons name="mic" size={20} color={COLORS.primary} />
          <Text style={styles.listeningText}>Aguardando 'próximo'...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 16,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recipeName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: 16,
  },
  stepCounter: {
    fontSize: 14,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressContainer: {
    height: 4,
    backgroundColor: COLORS.border,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: 24,
  },
  stepNumberContainer: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: SIZES.radius,
    marginBottom: 20,
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  stepTextContainer: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 24,
  },
  stepText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  completedStepsContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radius,
    padding: 12,
  },
  completedStepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  completedStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  completedStepText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  currentStepHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    padding: SIZES.padding,
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlLabel: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  listeningIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },
  listeningText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.background,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
});
