import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Loading from '../ui/Loading';
import VoiceButton from '../ai/VoiceButton';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';
import { errorMessage } from '../../lib/api';
import { buildGuidedPlan } from '../../lib/guided';
import { localRecipes } from '../../lib/localStore';
import { describeIngredient } from '../../lib/recipeSpeech';
import type { Ingredient, RecipeStage } from '../../lib/types';
import { speak } from '../../lib/speech';
import { COMMANDS, GuidedCommand, normalize, PHRASES } from '../../lib/voicePhrases';
import { useVoiceSettings } from '../../lib/voiceSettings';
import { COLORS, SIZES } from '../../lib/constants';

/** Reconhece comandos curtos ("estou pronto", "próxima etapa", "repete"...). Frases longas não são comandos. */
const MAX_COMMAND_WORDS = 8; // frases mais longas são conversa, não comando

export function parseCommand(text: string): GuidedCommand | null {
  const normalized = normalize(text);
  if (normalized.split(/\s+/).length > MAX_COMMAND_WORDS) return null;
  const match = (Object.entries(COMMANDS) as [GuidedCommand, RegExp][]).find(([, pattern]) => pattern.test(normalized));
  return match?.[0] ?? null;
}

/** O Whisper pontua perguntas com "?"; só elas vão para a IA durante a pausa. */
const isQuestion = (text: string) => text.trim().endsWith('?');

interface GuidedStep {
  label: string;
  /** Texto exibido na tela. */
  text: string;
  /** Texto falado pelo assistente. */
  speech: string;
}

const bullets = (ingredients: Ingredient[]) => ingredients.map((i) => `• ${describeIngredient(i)}`).join('\n');
const numbered = (steps: string[]) => steps.map((step, n) => `${n + 1}. ${step}`).join('\n');

/**
 * Roteiro do modo guiado, com uma pausa ao fim de cada item:
 * - para cada componente (ex.: massa, recheio, cobertura) ou para a receita inteira, se tiver
 *   um só preparo: mise en place com os ingredientes dele e cada fase (preparo, cocção, descanso);
 * - por fim, o preparo final (montagem, finalização) de uma vez.
 */
function buildSteps(stages: RecipeStage[]): GuidedStep[] {
  const multiple = stages.filter((stage) => !stage.final).length > 1;

  return stages.flatMap((stage): GuidedStep[] => {
    const miseEnPlace = stage.ingredients.length
      ? PHRASES.miseEnPlace(stage.ingredients.map(describeIngredient).join('; ')) + ' '
      : '';

    if (stage.final) {
      const steps = stage.phases.flatMap((phase) => phase.steps);
      return [
        {
          label: stage.title,
          text: [bullets(stage.ingredients), numbered(steps)].filter(Boolean).join('\n\n'),
          speech: PHRASES.finalPrep([miseEnPlace + steps[0], ...steps.slice(1)]),
        },
      ];
    }

    const prefix = multiple ? `${stage.title} · ` : '';
    const intro = multiple ? PHRASES.component(stage.title) + ' ' : '';
    const items: GuidedStep[] = stage.phases.map((phase) => ({
      label: prefix + phase.name,
      text: numbered(phase.steps),
      speech: PHRASES.phase(phase.name, phase.steps),
    }));
    if (stage.ingredients.length) {
      items.unshift({ label: `${prefix}Mise en place`, text: bullets(stage.ingredients), speech: miseEnPlace.trim() });
    }
    if (items.length) items[0].speech = intro + items[0].speech;
    return items;
  });
}

interface Props {
  recipeId: number;
  onClose: () => void;
}

export default function GuidedRecipeMode({ recipeId, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState<GuidedStep[]>([]);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const stepsRef = useRef<GuidedStep[]>([]);
  const { voiceId } = useVoiceSettings();
  const say = useCallback((text: string) => speak(text, voiceId), [voiceId]);

  /** Lê o passo e pausa, pedindo confirmação para seguir. */
  /** Lê a etapa; `prompt` acrescenta o aviso "quando estiver pronto…" (não é repetido no "repetir"). */
  const goTo = useCallback(
    async (i: number, prompt = true) => {
      indexRef.current = i;
      setIndex(i);
      const isLast = i === stepsRef.current.length - 1;
      await say(stepsRef.current[i].speech);
      if (prompt) await say(isLast ? PHRASES.lastReadyPrompt : PHRASES.readyPrompt);
    },
    [say],
  );

  const finish = useCallback(async () => {
    await say(PHRASES.finished);
    onClose();
  }, [onClose, say]);

  /** Executa o comando. Retorna false quando a condução terminou (receita concluída ou saída). */
  const runCommand = useCallback(
    async (command: GuidedCommand): Promise<boolean> => {
      const i = indexRef.current;
      const last = stepsRef.current.length - 1;
      if (command === 'exit' || (command === 'next' && i === last)) {
        await (command === 'exit' ? onClose() : finish());
        return false;
      }
      if (command === 'next') await goTo(i + 1);
      if (command === 'previous') await goTo(Math.max(0, i - 1));
      if (command === 'repeat') await goTo(i, false); // relê e fica esperando em silêncio
      return true;
    },
    [goTo, finish, onClose],
  );

  /**
   * Pausa entre passos: perguntas vão para a IA (sem avançar); comandos são executados;
   * qualquer outra fala é ignorada até o usuário dizer que está pronto.
   * A pergunta vem primeiro para "quanto falta para ficar pronto?" não virar comando.
   */
  const onCommand = useCallback(
    async (text: string) => {
      // Comando primeiro: "Pode repetir?" é um pedido para repetir, não uma pergunta para a IA.
      const command = parseCommand(text);
      if (command) {
        await runCommand(command);
        return true;
      }
      return !isQuestion(text);
    },
    [runCommand],
  );

  const agent = useVoiceAgent({ recipeId, onCommand });
  const lastAnswer = [...agent.messages].reverse().find((m) => m.role === 'assistant');

  useEffect(() => {
    localRecipes
      .get(recipeId)
      .then(async (recipe) => {
        if (!recipe) throw new Error('Receita não encontrada');
        const guided = buildSteps(buildGuidedPlan(recipe));
        stepsRef.current = guided;
        setTitle(recipe.title);
        setSteps(guided);
        await say(PHRASES.guidedIntro);
        await goTo(0);
        void agent.talk(true);
      })
      .catch((e) => {
        Alert.alert('Erro', errorMessage(e, 'Não foi possível carregar os passos'));
        onClose();
      });
  }, [recipeId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Botões da tela fazem o mesmo que a voz e, em seguida, o assistente volta a ouvir sozinho. */
  const press = async (command: GuidedCommand) => {
    agent.cancel();
    if (await runCommand(command)) void agent.talk(true);
  };

  if (!steps.length) return <Loading />;

  const isLast = index === steps.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.counter}>{index + 1}/{steps.length}</Text>
      </View>
      <View style={styles.progress}>
        <View style={[styles.progressBar, { width: `${((index + 1) / steps.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.stepLabel}>{steps[index].label}</Text>
        <Text style={styles.stepText}>{steps[index].text}</Text>
        <Text style={styles.readyHint}>
          {isLast ? 'Diga "pronto" ou "terminado" para concluir.' : 'Diga "pronto" ou "próximo" para continuar.'}
          {' Diga "repetir" quantas vezes quiser para ouvir de novo.'}
        </Text>
        {lastAnswer && (
          <View style={styles.answer}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.secondary} />
            <Text style={styles.answerText}>{lastAnswer.content}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.voice}>
        <VoiceButton
          status={agent.status}
          onPress={() => (agent.status === 'idle' ? agent.talk(true) : agent.cancel())}
        />
      </View>

      <View style={styles.controls}>
        <Control icon="chevron-back" label="Anterior" onPress={() => press('previous')} disabled={index === 0} />
        <Control icon="repeat" label="Repetir" onPress={() => press('repeat')} />
        <Control
          icon={isLast ? 'checkmark' : 'chevron-forward'}
          label={isLast ? 'Finalizar' : 'Próxima'}
          onPress={() => press('next')}
          primary
        />
      </View>
    </View>
  );
}

interface ControlProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
}

function Control({ icon, label, onPress, disabled, primary }: ControlProps) {
  const color = primary ? COLORS.background : COLORS.text;
  return (
    <TouchableOpacity
      style={[styles.control, primary && styles.controlPrimary, disabled && { opacity: 0.4 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.controlLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: SIZES.padding },
  title: { flex: 1, fontSize: 18, fontWeight: '600', color: COLORS.text },
  counter: { fontSize: 14, color: COLORS.textSecondary },
  progress: { height: 4, backgroundColor: COLORS.border },
  progressBar: { height: '100%', backgroundColor: COLORS.secondary },
  content: { padding: SIZES.padding, gap: 16 },
  stepLabel: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  stepText: { fontSize: 20, lineHeight: 30, color: COLORS.text },
  readyHint: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic' },
  answer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.cardBg,
  },
  answerText: { flex: 1, fontSize: 15, lineHeight: 21, color: COLORS.text },
  voice: { alignItems: 'center', paddingVertical: 12 },
  controls: { flexDirection: 'row', gap: 8, padding: SIZES.padding },
  control: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  controlPrimary: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  controlLabel: { fontSize: 12, marginTop: 4, fontWeight: '500' },
});
