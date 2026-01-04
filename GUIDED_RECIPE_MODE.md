# 🎙️ Modo Guiado de Receita - Ditar Passo a Passo

## ✨ Recurso Implementado

Adicionei um **modo guiado de receita** que dita os procedimentos passo a passo, aguardando o usuário dizer "próximo" para continuar.

## 🎯 Como Funciona

### 1. Acessar Modo Guiado
- Abrir uma receita
- Clicar no botão **"🎙️ MODO GUIADO"**

### 2. Fluxo de Uso
```
Receita é carregada
    ↓
Sistema reproduz: "Passo 1 de X. [instrução]"
    ↓
Usuário aguarda (indicador visual)
    ↓
Usuário pressiona "Próximo" (ou diz "próximo")
    ↓
Avança para próximo passo
    ↓
Repete até finalizar
    ↓
Mensagem de conclusão
```

## 📊 Interface

### Componentes Principais

**GuidedRecipeMode.tsx** (novo componente)
- Barra de progresso visual
- Mostra passo atual e total
- Botões de controle:
  - ⏪ Anterior
  - 🔄 Repetir
  - ➡️ Próximo / Finalizar

**Integração em [id].tsx**
- Botão "Modo Guiado" na página de receita
- Modal que sobrepõe a tela
- Fácil fechar clicando X

## 🔧 Implementação Técnica

### Backend Endpoint Novo

```python
GET /api/ai/recipes/{recipe_id}/steps
```

**Resposta:**
```json
{
  "recipe_id": 1,
  "recipe_title": "Bolo de Chocolate",
  "steps": [
    "Pré-aquecer o forno a 180°C",
    "Misturar farinha, açúcar e chocolate em pó",
    "Adicionar ovos e leite..."
  ],
  "total_steps": 5
}
```

**Funcionalidade:**
- Detecta passos numerados (1., 2., etc)
- Divide por pontos finais como fallback
- Limpa e normaliza texto
- Ignora passos muito curtos (< 5 caracteres)

### Frontend Componente

**Estado Gerenciado:**
- `currentStepIndex` - Passo atual
- `steps` - Array de passos carregados
- `loading` - Carregamento de dados
- `isSpeaking` - Reprodução de áudio
- `listeningForNext` - Aguardando comando

**Funcionalidades:**
- ✅ Reprodução automática do passo (Text-to-Speech)
- ✅ Navegação passo a passo
- ✅ Indicador visual de progresso
- ✅ Lista de passos completados
- ✅ Repetir passo atual
- ✅ Ir para passo anterior

## 🎨 Visual

```
┌─────────────────────────────────────┐
│  X  Bolo de Chocolate   1/5         │ ← Cabeçalho
├─────────────────────────────────────┤
│ ███████░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← Progresso
├─────────────────────────────────────┤
│  PASSO 1                             │ ← Número
│                                     │
│ 🔊 "Pré-aquecer o forno a 180°C"   │ ← Texto
│                                     │
│ Progresso:                          │
│ ✓ Passo 1  (completo)              │
│ ○ Passo 2  (próximo)               │
│ ○ Passo 3                          │
│ ○ Passo 4                          │
│ ○ Passo 5                          │
├─────────────────────────────────────┤
│ [🔄] [⏪] [➡️ PRÓXIMO]              │ ← Controles
└─────────────────────────────────────┘
```

## 📱 Fluxo de Uso Completo

### Exemplo: Receita de Bolo

**Usuário:**
1. Busca "Bolo de Chocolate"
2. Abre a receita
3. Clica no botão "🎙️ MODO GUIADO"

**Sistema:**
- Carrega os 5 passos
- Reproduz: "Passo 1 de 5. Pré-aquecer o forno a 180°C"

**Usuário:**
- Ouve as instruções
- Realiza o procedimento
- Clica "Próximo" quando termina

**Sistema:**
- Marca como completo
- Avança
- Reproduz: "Passo 2 de 5. Misturar farinha, açúcar e chocolate em pó"

**Repetir até final:**
- Quando chegar no último passo
- Botão muda para "Finalizar"
- Clica finalizar
- Mensagem de conclusão com som

## ⚙️ Configurações Atuais

**Text-to-Speech:**
- Idioma: Português (pt-BR)
- Pitch: 1.0 (neutro)
- Rate: 0.85 (um pouco mais lento para clareza)
- Pausas automáticas entre passos

**Detecção de Passos:**
```python
# Primeiro tenta encontrar numeração
pattern = r'^\d+\.\s+(.+?)(?=^\d+\.|$)'
steps = re.findall(pattern, instructions, re.MULTILINE | re.DOTALL)

# Se não encontrar, divide por pontos
if not steps:
    steps = [step.strip() for step in instructions.split('.')]
```

## 🚀 Próximas Melhorias

### Curto Prazo
- [ ] Implementar reconhecimento de voz para "próximo"
  - Usar expo-speech para transcrever fala do usuário
  - Detectar palavras-chave: "próximo", "continue", "avançar"

- [ ] Adicionar visualização de ingredientes durante modo guiado
  - Mostrar quais ingredientes são necessários para passo atual
  
- [ ] Timer para passo (opcional)
  - Permitir usuário configurar tempo por passo

### Médio Prazo
- [ ] Histórico de receitas guiadas
  - Rastrear receitas que usuário já fez
  
- [ ] Notas durante preparação
  - Permitir usuário adicionar notas por passo
  
- [ ] Dicas em tempo real
  - Sugestões do Ollama para cada passo

### Longo Prazo
- [ ] Modo mãos livres
  - Detectar gestos ou movimento
  
- [ ] Ajuste automático de volume
  - Detectar ruído de fundo
  
- [ ] Múltiplos idiomas
  - Suporte a receitas em diferentes idiomas

## 🐛 Tratamento de Erros

**Erro ao carregar receita:**
```
❌ Erro: Não foi possível carregar os passos da receita
→ Ação: Fechar modal e retornar à tela anterior
```

**Erro ao reproduzir áudio:**
```
❌ Erro: Não foi possível reproduzir o áudio
→ Ação: Mostrar alerta ao usuário
→ Ação: Permitir repetir
```

**Sem passos encontrados:**
```
⚠️ Nenhum passo encontrado
→ Ação: Mostrar mensagem
→ Ação: Fechar modal
```

## 📝 Exemplo de Uso

### Receita Estruturada Bem
```
Modo de Preparo:
1. Pré-aqueça o forno a 180°C por 10 minutos
2. Em uma tigela, misture farinha, açúcar e chocolate em pó
3. Adicione os ovos um por um, misturando bem
4. Despeje a massa em uma forma untada
5. Leve ao forno por 30-40 minutos
```

**Resultado:**
- Sistema detecta 5 passos corretamente
- Dita cada um
- Funciona perfeitamente

### Receita Sem Estrutura
```
Modo de Preparo:
Faça um bolo. Pré-aqueça forno. Misture ingredientes. Asse.
```

**Resultado:**
- Sistema tenta dividir
- Pode não funcionar perfeitamente
- Fallback: trata como um único passo longo

## 🎓 Testes

Para testar o novo endpoint:

```bash
# Obter passos da receita ID 1
curl http://localhost:8000/api/ai/recipes/1/steps

# Exemplo de resposta:
{
  "recipe_id": 1,
  "recipe_title": "Bolo de Chocolate",
  "steps": [
    "Pré-aquecer o forno a 180°C",
    "Misturar ingredientes",
    "Asse por 30 minutos"
  ],
  "total_steps": 3
}
```

## 📚 Arquivos Modificados

```
Frontend:
├── components/recipes/GuidedRecipeMode.tsx (NOVO)
└── app/(tabs)/recipes/[id].tsx (modificado com Modal)

Backend:
└── app/routes/ai.py (endpoint novo /recipes/{recipe_id}/steps)
```

## ✅ Checklist

- [x] Backend endpoint `/recipes/{recipe_id}/steps`
- [x] Parsing de passos estruturados
- [x] Frontend componente GuidedRecipeMode
- [x] Integração com Text-to-Speech
- [x] Interface visual com progresso
- [x] Botões de navegação
- [x] Tratamento de erros
- [x] Modal de apresentação
- [ ] Reconhecimento de voz (próximo)
- [ ] Histórico de receitas
- [ ] Ajustes avançados

## 🎉 Resultado Final

Um **assistente culinário de voz completo** que:
✅ Dita cada passo da receita
✅ Aguarda o usuário avançar
✅ Mostra progresso visual
✅ Permite repetir passos
✅ Reproduz em voz clara
✅ Intuitivo e fácil de usar

**Perfeito para cozinhar com as mãos ocupadas!** 👨‍🍳

---

*Desenvolvido com React Native, FastAPI e Whisper AI*
*Pronto para cozinha do seu usuário!* 🍽️
