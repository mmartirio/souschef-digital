# SousChef Digital

App de receitas com assistente culinário por voz. Tudo roda localmente: **React Native (Expo)** no app, **FastAPI + SQLite** no backend, **Ollama** (LLM) e **faster-whisper** (voz → texto).

## Como rodar

### Backend (Docker)

```bash
cp backend/.env.example .env        # defina SECRET_KEY e POSTGRES_PASSWORD (valores aleatórios)
docker compose up -d --build
docker compose exec ollama ollama pull qwen2.5:1.5b   # só na primeira vez (~1 GB)
curl localhost:8000/ai/health       # {"ollama":true,"transcription":true,...}
```

Na primeira subida, o modelo e o Whisper são carregados em segundo plano (pode levar alguns minutos em CPU). Depois disso ficam em memória.

Documentação da API: http://localhost:8000/docs

### Backend (sem Docker)

```bash
cd backend
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt   # Linux/mac: .venv/bin/pip
.venv/Scripts/uvicorn app.main:app --reload --host 0.0.0.0
.venv/Scripts/python -m pytest -q tests
```

### App

```bash
cd frontend
cp .env.example .env     # emulador Android: EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
npm install
npm run android          # ou: npm start / npm run web
npm run typecheck
```

Sem `EXPO_PUBLIC_API_URL`, o app usa o IP da máquina que roda o Metro (funciona em celular físico na mesma rede).

## Assistente de voz

| Onde | O que faz |
|---|---|
| Aba **Assistente** | Toque uma vez no microfone e converse: ele ouve → responde falando → volta a ouvir. Silêncio não encerra; diga "tchau" ou toque de novo para parar. Também aceita texto. |
| **Modo guiado** (detalhe da receita) | Para cada componente (ex.: massa, recheio, cobertura; ou a receita inteira, se tiver um só preparo): anuncia o componente, faz a **mise en place** com os ingredientes dele e cada fase (**preparo, cocção, descanso**). No fim, o **preparo final** (montagem). Pausa após cada item até ouvir *pronto*, *próximo* ou *terminado*. Também: *anterior*, *repetir*, *sair*. Perguntas vão para a IA sem avançar; outras falas são ignoradas. |
| **Pedido de receita** (Assistente) | "Quero fazer brigadeiro", "como faço bolo Matilda?": diz *"Vou procurar no meu livro de receitas"*, busca e, ao achar, *"Encontrei a receita. Vamos!"* e abre o modo guiado. |
| Microfone da **home** | Abre o assistente já ouvindo. |
| Menu ☰ → **Assistente de voz** | Voz Feminina (padrão do sistema) ou Masculina (`pt-br-x-ptd-local`), com prévia. |

Cada fala termina sozinha após ~1,5 s de silêncio (detecção por nível de áudio), sem precisar apertar nada.

Fluxo: `expo-audio` grava → `POST /ai/transcribe` (faster-whisper) → `POST /ai/chat` (Ollama) → `expo-speech` fala a resposta.

### Receitas iniciais

~200 receitas populares (nacionais e internacionais) ficam em `backend/app/knowledge/receitas/*.json`, no mesmo formato de `POST /recipes/`. Na inicialização, o backend sincroniza as receitas do autor "SousChef" com esses arquivos (cria as novas e atualiza as alteradas). Para adicionar ou corrigir, edite o JSON e reinicie. Quando a pergunta cita uma receita do app, o agente usa os ingredientes e o modo de preparo dela na resposta.

No modo de preparo, linhas `## Título` separam os preparos, que viram etapas no modo guiado:

```
## Massa
1. Bata os ovos...
## Cobertura
1. Derreta o chocolate...
```

### Ensinar o agente

O agente usa um modelo pequeno (`qwen2.5:1.5b`, trocável por `OLLAMA_MODEL`) e é "ensinado" por uma base de conhecimento em JSON:

```
backend/app/knowledge/*.json
[{ "topic": "...", "keywords": ["..."], "content": "..." }]
```

A cada pergunta, os itens mais relevantes (por palavras-chave) e as receitas do app com título parecido entram no prompt. Para ensinar algo novo, basta adicionar um item. O arquivo é recarregado automaticamente, sem reiniciar.

## Login com Google

1. No Google Cloud Console, crie IDs de cliente OAuth (Web, Android e/ou iOS).
2. Backend: `GOOGLE_CLIENT_IDS=<id-web>,<id-android>,...` no `.env`.
3. App: `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` no `frontend/.env`.

O app obtém o `id_token` do Google; o backend o valida no Google e emite o JWT do próprio app. Contas com o mesmo email são vinculadas. O botão só aparece quando há client IDs configurados. No Android/iOS nativo é preciso um *development build* (`npx expo run:android`), porque o Expo Go não suporta o redirect do Google.

## Estrutura

```
backend/app/
  main.py                 app, CORS, health, warm-up dos modelos
  schemas.py              contratos da API (espelhados em frontend/lib/types.ts)
  models/                 SQLAlchemy: User, Recipe, Ingredient, Favorite
  routes/                 auth, users, recipes, categories, favorites, ai
  services/               ollama, transcription, knowledge, google_auth
  knowledge/              base de conhecimento do agente
frontend/
  app/                    telas (expo-router): home, (auth), (tabs)
  components/             ui, layout, recipes, ai
  hooks/                  useVoiceRecorder, useVoiceAgent, useFavorites
  lib/                    api, auth (contexto), types, constants, speech
```

## Endpoints principais

`POST /auth/register` · `POST /auth/login` (form) · `POST /auth/google` · `GET /auth/me`
`GET|POST /recipes/` · `GET|PUT|DELETE /recipes/{id}` · `GET /recipes/{id}/steps`
`GET /categories/` · `GET|POST /favorites/` · `GET /favorites/ids` · `DELETE /favorites/{id}`
`POST /ai/chat` · `POST /ai/transcribe` · `GET /ai/health` · `GET /ai/models`
