import type { Ingredient } from './types';

/**
 * Padrão único de leitura em voz alta: tudo que o assistente fala passa por `toSpeech`,
 * para que medidas e unidades soem sempre iguais ("200 g" → "200 gramas", "1/3" → "um terço",
 * "2 g açúcar" → "2 gramas de açúcar") e termos estrangeiros sejam pronunciados ("Misan plasse").
 */
const FRACTIONS: Record<string, string> = {
  '1/2': 'meia',
  '1/3': 'um terço',
  '2/3': 'dois terços',
  '1/4': 'um quarto',
  '3/4': 'três quartos',
};

/** Unidade abreviada → nome falado (singular só quando a quantidade é exatamente 1). */
const unit = (abbreviation: string, singular: string): [RegExp, (match: string, amount: string) => string] => [
  new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${abbreviation}\\b`, 'gi'),
  (_, amount) => `${amount} ${amount === '1' ? singular : `${singular}s`}`,
];

const UNITS: [RegExp, (match: string, amount: string) => string][] = [
  unit('kg', 'quilo'),
  unit('mg', 'miligrama'),
  unit('g', 'grama'),
  unit('ml', 'mililitro'),
  unit('l', 'litro'),
  [/\s*°\s*C\b/g, () => ' graus'],
];

/** Termos estrangeiros falados como se pronunciam (o sintetizador pt-BR lê letra por letra). */
const PRONUNCIATIONS: [RegExp, string][] = [[/mise en place/gi, 'Misan plasse']];

/**
 * Qualquer unidade de medida sem "de" antes do ingrediente ganha o "de" na fala:
 * "2 g açúcar" → "2 gramas de açúcar", "1 xícara leite" → "1 xícara de leite",
 * "1 colher de chá rasa sal" → "1 colher de chá rasa de sal", "3 dentes alho" → "3 dentes de alho".
 */
const MEASURE_WITHOUT_DE = new RegExp(
  '(\\d+(?:[.,]\\d+)?|meia|um terço|dois terços|um quarto|três quartos)\\s+' +
    '(gramas?|quilos?|miligramas?|mililitros?|litros?|dentes?|' +
    'xícaras?(?: de chá)?|colher(?:es)?(?: de (?:sopa|chá|café|sobremesa))?|canecas?|copos?|' +
    'latas?|caixas?|pitadas?|maços?|fatias?|pedaços?|ramos?|folhas?|unidades?|vidros?|pacotes?|' +
    'potes?|tabletes?|doses?|punhados?|postas?|filés?)' +
    '((?:\\s+(?:rasas?|cheias?|bem cheias?))?)' +
    // não insere antes de "de", de conectivos ("2 xícaras e misture") nem antes do qualificador
    '\\s+(?!(?:de|do|da|dos|das|e|ou|a|à|ao|por|para|com|rasas?|cheias?|bem)(?:\\s|[.,;]|$))(?=[a-zà-ú])',
  'gi',
);

export function toSpeech(text: string): string {
  let spoken = text.replace(/\b([1-3])\/([2-4])\b/g, (fraction) => FRACTIONS[fraction] ?? fraction);
  for (const [pattern, replacement] of UNITS) spoken = spoken.replace(pattern, replacement);
  for (const [pattern, replacement] of PRONUNCIATIONS) spoken = spoken.replace(pattern, replacement);
  spoken = spoken.replace(MEASURE_WITHOUT_DE, '$1 $2$3 de ');
  return spoken.replace(/\s*·\s*/g, ', ');
}

/**
 * Ingrediente como foi cadastrado: "200 g flocão de milho", "3 ovos", "sal a gosto".
 * Sem número, a quantidade vem depois do nome. O "de" entre medida e ingrediente é
 * acrescentado só na fala, por `toSpeech`.
 */
export function describeIngredient({ name, quantity }: Ingredient): string {
  const q = quantity?.trim();
  if (!q) return name;
  if (!/^\d/.test(q)) return `${name} ${q}`; // "a gosto", "o suficiente", "para servir"
  if (/de cada$/i.test(q)) return `${name}, ${q}`;
  return `${q} ${name}`;
}
