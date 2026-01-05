# SousChef Digital - Frontend Setup

## Visão Geral
Frontend mobile desenvolvido com React Native, Expo Router e TypeScript. Aplicação completa com autenticação, gerenciamento de receitas, categorias e assistente IA.

## Requisitos
- Node.js 16+
- npm ou yarn
- Expo CLI instalado globalmente: `npm install -g expo-cli`
- Android Studio (para emulador Android) ou Xcode (para iOS)

## Instalação

### 1. Instalar Dependências
```bash
cd frontend
npm install
# ou
yarn install
```

### 2. Configurar Backend
Certifique-se de que o backend está rodando em `http://localhost:8000`:
```bash
cd backend
source venv/bin/activate  # Em Windows: venv\Scripts\activate
python app/main.py
```

## Executar a Aplicação

### Opção 1: Expo Go (Mais Rápido)
```bash
npm start
# Escanear QR code com o Expo Go no seu celular
```

### Opção 2: Emulador Android
```bash
npm run android
# Certifique-se de que o Android Studio está configurado
```

### Opção 3: Emulador iOS (macOS)
```bash
npm run ios
```

### Opção 4: Web
```bash
npm run web
```

## Estrutura do Projeto

```
frontend/
├── app/                          # Rotas e telas
│   ├── _layout.tsx              # Layout raiz
│   ├── index.tsx                # Home screen
│   ├── (auth)/                  # Autenticação (Stack)
│   │   ├── _layout.tsx
│   │   ├── login.tsx            # Tela de login
│   │   └── register.tsx         # Tela de registro
│   └── (tabs)/                  # Navegação por abas
│       ├── _layout.tsx          # Tab navigation
│       ├── index.tsx            # Home tab
│       ├── recipes/             # Gerenciamento de receitas
│       │   ├── index.tsx        # Lista de receitas
│       │   ├── [id].tsx         # Detalhes da receita
│       │   └── create.tsx       # Criar receita
│       ├── categories/          # Categorias
│       │   └── index.tsx        # Lista de categorias
│       ├── ai-assistant/        # Assistente IA
│       │   └── index.tsx        # Chat com IA
│       └── profile/             # Perfil do usuário
│           └── index.tsx        # Perfil e configurações
├── components/                  # Componentes reutilizáveis
│   ├── ui/                      # Componentes básicos
│   │   ├── Button.tsx           # Botão personalizado
│   │   ├── Input.tsx            # Input com validação
│   │   ├── Card.tsx             # Card com sombra
│   │   ├── Loading.tsx          # Indicador de carregamento
│   │   └── Modal.tsx            # Modal reutilizável
│   ├── layout/                  # Componentes de layout
│   │   ├── Header.tsx           # Cabeçalho com logo
│   │   └── TabBar.tsx           # Barra de navegação
│   ├── recipes/                 # Componentes de receitas
│   │   ├── RecipeCard.tsx       # Card de receita
│   │   ├── RecipeList.tsx       # Lista de receitas
│   │   └── IngredientItem.tsx   # Item de ingrediente
│   └── ai/                      # Componentes de IA
│       ├── AIAssistant.tsx      # Interface do assistente
│       └── ChatBubble.tsx       # Bolha de chat
├── lib/                         # Utilitários e configurações
│   ├── constants.ts             # Cores, tamanhos, fontes
│   ├── api.ts                   # Configuração do cliente HTTP
│   ├── auth.ts                  # Funções de autenticação
│   ├── ollama.ts                # Integração com Ollama
│   ├── supabase.ts              # Integração com Supabase (futuro)
│   └── types.ts                 # Tipos TypeScript
├── app.json                     # Configuração do Expo
├── package.json                 # Dependências e scripts
└── tsconfig.json                # Configuração do TypeScript
```

## Fluxo de Autenticação

1. **Tela de Login** - Acesso com email e senha
2. **Tela de Registro** - Criar nova conta
3. **Token JWT** - Armazenado em AsyncStorage
4. **Rotas Protegidas** - Apenas usuários autenticados acessam

> **TODO**: Implementar persistência de token e auto-login

## Funcionalidades Principais

### 🔐 Autenticação
- [x] Tela de login com validação
- [x] Tela de registro com confirmação de senha
- [x] Validação de email
- [ ] Persistência de sessão
- [ ] Recuperação de senha

### 👨‍🍳 Gerenciamento de Receitas
- [x] Listar receitas com filtros
- [x] Buscar receitas por nome
- [x] Visualizar detalhes da receita
- [x] Criar nova receita
- [ ] Editar receita
- [ ] Deletar receita
- [ ] Favoritar/desfavoritar receita

### 🏷️ Categorias
- [x] Listar categorias
- [ ] Filtrar receitas por categoria
- [ ] Detalhes da categoria

### 🤖 Assistente IA
- [x] Interface de chat
- [ ] Integração com Ollama
- [ ] Histórico de conversas
- [ ] Sugestões de receitas

### 👤 Perfil
- [x] Exibir informações do perfil
- [x] Menu de configurações
- [x] Logout
- [ ] Editar perfil
- [ ] Minhas receitas
- [ ] Histórico de favoritos

## Design System

### Cores
```typescript
export const COLORS = {
  primary: '#D4AF37',      // Ouro
  background: '#FFFFFF',   // Branco
  text: '#000000',         // Preto
  textSecondary: '#666666' // Cinza
};
```

### Componentes
- **Button**: Variantes primary, secondary, outline
- **Input**: Com ícones, validação e feedback
- **Card**: Container com sombra
- **Header**: Logo e navegação

## Integração com Backend

### API Endpoints
```
POST   /auth/login              - Fazer login
POST   /auth/register           - Registrar novo usuário
GET    /recipes                 - Listar receitas
POST   /recipes                 - Criar receita
GET    /recipes/{id}            - Detalhes da receita
PUT    /recipes/{id}            - Editar receita
DELETE /recipes/{id}            - Deletar receita
GET    /categories              - Listar categorias
POST   /favorites               - Adicionar aos favoritos
DELETE /favorites/{id}          - Remover dos favoritos
POST   /ai/chat                 - Chat com IA
```

### Client HTTP
Configurado em `lib/api.ts`:
```typescript
const API_URL = 'http://localhost:8000';
```

## Troubleshooting

### Erro de conexão com backend
1. Verifique se o backend está rodando
2. Confirme que é `localhost:8000` (não `127.0.0.1`)
3. No emulador Android, use `10.0.2.2:8000`

### Erro de módulo não encontrado
```bash
npm install
# Limpar cache
npm start -- --clear
```

### Emulador Android não aparece
```bash
adb devices
# Se vazio, reinicie o Android Studio
```

## Próximos Passos

1. [ ] Implementar persistência de token
2. [ ] Adicionar testes unitários
3. [ ] Integração com câmera (fotos de receitas)
4. [ ] Temas claro/escuro
5. [ ] Navegação por drawer
6. [ ] Compartilhamento de receitas
7. [ ] Notificações push

## Contato e Suporte

Para mais informações, consulte o README principal do projeto.
