// Frases faladas pelo agente e comandos de voz reconhecidos (pt-BR).
// Os padrões são testados em texto minúsculo e sem acentos (ver normalize).

export const VOICE_LANGUAGE = 'pt-BR';

export type GuidedCommand = 'next' | 'previous' | 'repeat' | 'exit';

export const PHRASES = {
  greeting: 'Olá! Sou o SousChef. Toque no microfone e converse comigo; diga "tchau" para encerrar.',
  sample: 'Olá! Eu sou o SousChef, seu assistente de cozinha.',
  goodbyeReply: 'Até mais! Bom apetite.',
  chatError: 'Não consegui falar com o assistente agora.',
  guidedIntro: 'Modo guiado. Vou pausar a cada etapa e esperar você. Se tiver dúvida, é só perguntar.',
  /** Anuncia o componente quando a receita tem mais de um preparo (ex.: massa, recheio). */
  component: (title: string) => `Vamos preparar: ${title}.`,
  miseEnPlace: (ingredients: string) => `Mise en place. Separe os ingredientes: ${ingredients}.`,
  /** Fase de um componente (ex.: "Cocção. Asse a 180 graus..."). */
  phase: (name: string, steps: string[]) => `${name}. ${steps.join(' ')}`,
  finalPrep: (steps: string[]) => `Agora, o preparo final. ${steps.join(' ')}`,
  // Não citar "repetir" na fala: o microfone captaria o fim da frase e repetiria sozinho.
  readyPrompt: 'Quando estiver pronto, diga: pronto, ou próximo.',
  lastReadyPrompt: 'Essa foi a última etapa. Quando terminar, diga: pronto, ou terminado.',
  finished: 'Parabéns, receita concluída! Bom apetite.',
  searchingRecipe: 'Vou procurar no meu livro de receitas.',
  foundRecipe: 'Encontrei a receita. Vamos!',
  recipeNotFound: 'Não encontrei essa receita no meu livro de receitas. Diga o nome da receita como está no livro.',
  recipeOptions: (titles: string[]) =>
    `No meu livro tenho: ${titles.join('; ')}. Qual delas você quer fazer?`,
};

export const GOODBYE = /^(tchau|encerrar|encerra|sair|parar|obrigad[oa],? (tchau|era isso))\b/;

export const COMMANDS: Record<GuidedCommand, RegExp> = {
  next: /\b(proxim[oa]|avanca\w*|seguinte|pront[oa]|feito|terminad[oa]|terminei|acabei|acabou|pode seguir|continua\w*|vamos|bora)\b/,
  previous: /\b(anterior|volta\w*)\b/,
  repeat: /\b(repet\w*|de novo|novamente|outra vez|mais uma vez|nao entendi|como e que e|fala de novo)\b/,
  exit: /\b(sair|parar|encerrar|terminar)\b/,
};

/** Pedido de receita ("quero fazer brigadeiro", "como faço bolo Matilda", "me ensina a fazer feijoada"). */
export const RECIPE_REQUEST =
  /\b(receitas?|(quero|queria|gostaria de|vamos|vou|bora) (fazer|cozinhar|preparar)|como (se )?(faz|faco|fazer|prepar\w*)|me (ensin|mostr)\w*|ensina\w* a fazer|abr[ea] a|faz(er)? (um|uma)|vamos de)\b/;

/** Minúsculas e sem acentos, para comparar com os padrões acima. */
export const normalize = (text: string) =>
  text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
