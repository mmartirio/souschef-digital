import type { Ingredient, Phase, Recipe, RecipePhase, RecipeStage } from './types';

/**
 * Plano do modo guiado, montado no próprio celular a partir da receita salva no banco local:
 * divide o modo de preparo em componentes (linhas "## Massa", "## Recheio"...), dá a cada um
 * os ingredientes que ele cita e agrupa os passos em fases (preparo, cocção, descanso).
 */

type Section = [title: string, steps: string[]];

const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'um', 'uma',
  'para', 'por', 'com', 'que', 'como', 'qual', 'quais', 'eu', 'meu', 'minha', 'posso', 'pode',
  'fazer', 'tem', 'ter', 'ser', 'mais', 'muito', 'se', 'ao', 'me', 'voce',
]);

// Etapas que finalizam a receita (juntam os componentes) em vez de preparar um componente.
const FINAL_STAGE = /\b(montagem|finaliza\w*|servir|gratinad\w*)\b/;
const FINAL_TITLE = 'Preparo final';

// Palavras que indicam a fase de um passo (texto sem acentos, minúsculo).
const REST_WORDS =
  /\b(descans\w*|gele|gelar|geladeira|congel\w*|repous\w*|crescer|firmar|marin\w*|de molho|esfri\w*)\b/;
const COOK_WORDS = new RegExp(
  '\\b(ass[ae]\\w*|cozinh\\w*|frit\\w*|fri[ae]|grelh\\w*|ferv\\w*|dour\\w*|refog\\w*|salteie|sele|' +
    'forno|fogo|chapa|banho maria|pressao|vapor|desligu\\w*|desgrud\\w*)\\b',
);

const NUMBERED_START = /^[ \t]*\d+[.)-][ \t]+/;
const NUMBERED_LINE = /(?:^|\n)[ \t]*\d+[.)-][ \t]+/;
const STAGE_HEADER = /^[ \t]*##[ \t]*(.+?)[ \t]*$/m;

const ascii = (text: string, form: 'NFD' | 'NFKD') => text.toLowerCase().normalize(form).replace(/[^\x00-\x7f]/g, '');
const plain = (text: string) => ascii(text, 'NFD').replace(/[^a-z0-9]+/g, ' ');
const nonEmpty = (parts: string[]) => parts.map((part) => part.trim()).filter(Boolean);

function tokenize(text: string): Set<string> {
  const words = ascii(text, 'NFKD').match(/[a-z0-9]+/g) ?? [];
  return new Set(words.filter((word) => word.length > 2 && !STOPWORDS.has(word)));
}

/** Palavras sem o plural simples ("ovos" → "ovo"), para comparar nomes. */
function stems(text: string): Set<string> {
  return new Set([...tokenize(text)].map((w) => (w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w)));
}

/** Passos: por linhas numeradas; sem numeração, por linhas ou por frases. */
export function splitSteps(instructions: string): string[] {
  const text = instructions.trim();
  let steps: string[];
  if (NUMBERED_START.test(text)) {
    steps = nonEmpty(text.split(new RegExp(NUMBERED_LINE, 'g')));
  } else {
    const lines = nonEmpty(text.split(/\r?\n/));
    steps = lines.length > 1 ? lines : nonEmpty(text.replace(/([.!?])\s+/g, '$1\u0000').split('\u0000'));
  }
  return steps.length ? steps : [text];
}

/** Seções pelas linhas "## Título"; o texto antes do primeiro título vira "Preparo". */
export function splitSections(instructions: string): Section[] {
  const parts = instructions.split(new RegExp(STAGE_HEADER, 'gm'));
  const sections: [string, string][] = [['Preparo', parts[0]]];
  for (let i = 1; i + 1 < parts.length; i += 2) sections.push([parts[i], parts[i + 1]]);
  const result: Section[] = sections
    .filter(([, body]) => body.trim())
    .map(([title, body]) => [title, splitSteps(body)]);
  return result.length ? result : [['Preparo', splitSteps(instructions)]];
}

const isFinalStage = (title: string) => FINAL_STAGE.test(plain(title));

function classifyStep(step: string): Phase {
  const text = plain(step);
  if (REST_WORDS.test(text)) return 'Descanso';
  if (COOK_WORDS.test(text)) return 'Cocção';
  return 'Preparo';
}

/** Agrupa passos consecutivos da mesma fase, mantendo a ordem da receita. */
function groupPhases(steps: string[]): RecipePhase[] {
  const phases: RecipePhase[] = [];
  for (const step of steps) {
    const name = classifyStep(step);
    const last = phases[phases.length - 1];
    if (last?.name === name) last.steps.push(step);
    else phases.push({ name, steps: [step] });
  }
  return phases;
}

/**
 * Cada ingrediente vai para a seção que cita mais palavras do seu nome
 * (ex.: "chocolate meio amargo (ganache)" → Ganache); em empate, a primeira.
 * Ingredientes não citados ficam na primeira seção de preparo.
 */
function assignIngredients(sections: Section[], ingredients: Ingredient[]): Ingredient[][] {
  const sectionWords = sections.map(([title, steps]) => stems(`${title} ${steps.join(' ')}`));
  const firstPrep = Math.max(0, sections.findIndex(([title]) => !isFinalStage(title)));
  const assigned: Ingredient[][] = sections.map(() => []);
  for (const ingredient of ingredients) {
    const nameWords = stems(ingredient.name);
    const scores = sectionWords.map((words) => [...nameWords].filter((w) => words.has(w)).length);
    const best = Math.max(...scores) > 0 ? scores.indexOf(Math.max(...scores)) : firstPrep;
    assigned[best].push({ name: ingredient.name, quantity: ingredient.quantity ?? null });
  }
  return assigned;
}

/** Componentes na ordem da receita, seguidos de um único "Preparo final" (se houver). */
export function buildGuidedPlan({ instructions, ingredients }: Pick<Recipe, 'instructions' | 'ingredients'>): RecipeStage[] {
  const sections = splitSections(instructions);
  const perSection = assignIngredients(sections, ingredients);
  const stages: RecipeStage[] = [];
  const finalSteps: string[] = [];
  const finalIngredients: Ingredient[] = [];
  sections.forEach(([title, steps], i) => {
    if (isFinalStage(title)) {
      finalSteps.push(...steps);
      finalIngredients.push(...perSection[i]);
    } else {
      stages.push({ title, final: false, ingredients: perSection[i], phases: groupPhases(steps) });
    }
  });
  if (finalSteps.length) {
    stages.push({ title: FINAL_TITLE, final: true, ingredients: finalIngredients, phases: groupPhases(finalSteps) });
  }
  return stages;
}
