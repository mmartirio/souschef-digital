import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../lib/constants';

/**
 * Passo a passo de como escrever a receita para o modo guiado funcionar bem.
 * As regras espelham backend/app/services/guided.py (etapas, fases e ingredientes).
 */
const STEPS: { title: string; body: string; example?: string }[] = [
  {
    title: 'Título, descrição e país',
    body: 'Use o nome pelo qual o prato é conhecido. É por ele que o assistente encontra a receita quando você pede por voz ("quero fazer bolo de cenoura").',
  },
  {
    title: 'Ingredientes (mise en place)',
    body: 'Adicione um ingrediente por vez, com o nome no primeiro campo e a quantidade no segundo. Liste tudo o que aparece no modo de preparo, inclusive sal, óleo e água. Use "fermento químico em pó" para bolos e "fermento biológico seco" para pães.',
    example: 'farinha de trigo · 2 xícaras\nfermento químico em pó · 1 colher de sopa',
  },
  {
    title: 'Mesmo ingrediente em partes diferentes',
    body: 'Se um ingrediente é usado em mais de uma parte, cadastre um item para cada uma, indicando a parte entre parênteses. Assim cada um vai para a mise en place certa.',
    example: 'açúcar (massa) · 1 xícara\naçúcar (cobertura) · 1/2 xícara',
  },
  {
    title: 'Modo de preparo: um passo por linha',
    body: 'Numere os passos (1., 2., 3.) e escreva uma ação por linha, começando pelo verbo. Cite os ingredientes pelo mesmo nome usado na lista.',
    example: '1. Bata os ovos com o açúcar.\n2. Junte a farinha aos poucos.',
  },
  {
    title: 'Use verbos claros de preparo, cocção e descanso',
    body: 'O assistente agrupa os passos em fases pelo verbo e faz uma pausa entre elas:\n• Preparo: misture, bata, corte, pique, junte.\n• Cocção: asse, cozinhe, frite, grelhe, ferva, doure, refogue, leve ao fogo ou ao forno.\n• Descanso: deixe descansar, gele, leve à geladeira, deixe crescer, marine.',
  },
  {
    title: 'Receita com mais de um preparo? Use ##',
    body: 'Quando o prato tem partes separadas (massa, recheio, cobertura), comece cada parte com uma linha "## Nome da parte" e numere os passos de novo a partir do 1. Receita de um preparo só não precisa de ##.',
    example: '## Massa\n1. Bata os ovos, o leite e o óleo.\n2. Asse a 180 °C por 40 minutos.\n## Cobertura\n1. Derreta o chocolate com o creme de leite.',
  },
  {
    title: 'Termine com a montagem',
    body: 'Se no fim as partes são juntadas, crie a última parte com "## Montagem" (ou "## Finalização"). Ela vira o "preparo final" no modo guiado.',
    example: '## Montagem\n1. Recheie o bolo e cubra com a cobertura.',
  },
  {
    title: 'Tempos e temperaturas',
    body: 'Informe tempo e temperatura nos passos de cocção e descanso ("asse a 180 °C por 40 minutos", "gele por 3 horas"). O assistente lê esses valores em voz alta.',
  },
];

export default function RecipeWritingGuide() {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setOpen(!open)} accessibilityRole="button">
        <Ionicons name="book-outline" size={20} color={COLORS.secondary} />
        <Text style={styles.headerText}>Como escrever sua receita</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {open && (
        <View style={styles.body}>
          <Text style={styles.intro}>
            Seguindo este padrão, o assistente de voz consegue guiar a receita etapa por etapa: mise en place,
            preparo, cocção e descanso.
          </Text>
          {STEPS.map((step, index) => (
            <View key={step.title} style={styles.step}>
              <Text style={styles.stepTitle}>
                {index + 1}. {step.title}
              </Text>
              <Text style={styles.stepBody}>{step.body}</Text>
              {step.example && <Text style={styles.example}>{step.example}</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  headerText: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 14 },
  intro: { fontSize: 14, lineHeight: 20, color: COLORS.textSecondary },
  step: { gap: 4 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  stepBody: { fontSize: 14, lineHeight: 20, color: COLORS.text },
  example: {
    marginTop: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.text,
  },
});
