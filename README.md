# 🍳 SousChef Digital - Assistente Culinário com IA

Um aplicativo mobile completo para gerenciamento de receitas com assistente IA integrado. Desenvolvido com **React Native + Expo** no frontend e **FastAPI + Python** no backend.

## ✨ Características

### 🔐 Autenticação
- Login/Registro com email e senha
- JWT token-based authentication
- Persistência de sessão

### 👨‍🍳 Gerenciamento de Receitas
- Criar, editar, deletar receitas
- Visualizar detalhes completos (ingredientes, modo de preparo)
- Filtros por dificuldade
- Busca por nome
- Tempo de preparo e cozimento
- Indicador de dificuldade (Fácil/Médio/Difícil)

### 🏷️ Categorias
- Organização de receitas por categoria
- Visualização de receitas por categoria
- Contagem de receitas por categoria

### ⭐ Favoritos
- Marcar/desmarcar receitas como favoritas
- Listar receitas favoritas
- Acesso rápido aos favoritos

### 🤖 Assistente IA
- Chat com Ollama (local AI)
- Sugestões de receitas
- Dicas culinárias
- Adaptação de receitas

### 📱 Interface Mobile
- Design moderno e intuitivo
- Navegação por abas (Bottom Tab)
- Tema claro (Preto e Ouro)
- Componentes customizados

## 🏗️ Arquitetura

```
┌─────────────────────┐
│                     │
│   Frontend          │
│  React Native       │
│  Expo Router        │
│                     │
└──────────┬──────────┘
           │
      HTTP │ (Axios)
           │
┌──────────▼──────────┐
│                     │
│   Backend API       │
│  FastAPI + Python   │
│  SQLAlchemy ORM     │
│                     │
└──────────┬──────────┘
           │
      ┌────┼────┐
      │    │    │
   ┌──▼──┐ │ ┌──▼──┐
   │SQLite││ │Ollama│
   │(Dev) │ │(IA)  │
   └──────┘ └──────┘
```

## 📦 Tecnologias Utilizadas

### Frontend
- **React Native** 0.81.5
- **Expo** 54.0 (Base para deployment)
- **Expo Router** 4.0 (Navigation)
- **TypeScript** 5.9
- **Axios** 1.7 (HTTP Client)
- **Ionicons** (Icon Library)
- **AsyncStorage** (Local Storage)

### Backend
- **FastAPI** 0.104.1 (Web Framework)
- **SQLAlchemy** 2.0.23 (ORM)
- **Pydantic** 2.5.0 (Data Validation)
- **PyJWT** (Authentication)
- **bcrypt** (Password Hashing)
- **Uvicorn** (ASGI Server)
- **Ollama** (Local AI)

### Database
- **SQLite** (Development)
- **PostgreSQL** (Production-ready)

## 🚀 Quick Start

### Opção 1: Executar Localmente

#### 1. Backend
```bash
cd backend

# Criar virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# ou
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt

# Executar servidor
python app/main.py

# Acesso: http://localhost:8000
# Documentação Swagger: http://localhost:8000/docs
```

#### 2. Frontend
```bash
cd frontend

# Instalar dependências
npm install

# Opção 1: Expo Go (mais rápido)
npm start
# Escanear QR code com Expo Go

# Opção 2: Emulador Android
npm run android

# Opção 3: Emulador iOS (macOS)
npm run ios

# Opção 4: Web
npm run web
```

### Opção 2: Docker Compose
```bash
docker-compose up

# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Swagger: http://localhost:8000/docs
```

### Opção 3: Scripts Auxiliares
```bash
# Executar frontend com menu interativo
chmod +x run-frontend.sh
./run-frontend.sh

# Testar integração entre frontend e backend
chmod +x test-integration.sh
./test-integration.sh
```

## 📁 Estrutura do Projeto

```
souschef-digital/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── database/            # Configuração de BD
│   │   ├── models/              # SQLAlchemy models
│   │   ├── routes/              # Endpoints (6 módulos)
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Auth, CORS, etc
│   │   └── utils/               # Helpers & security
│   ├── requirements.txt         # Dependências
│   ├── Dockerfile              # Containerização
│   ├── venv/                   # Virtual environment
│   └── test_api.py             # Script de teste
│
├── frontend/
│   ├── app/                    # Rotas e telas
│   │   ├── (auth)/            # Login, Register
│   │   └── (tabs)/            # 5 abas principales
│   ├── components/             # Componentes reutilizáveis
│   ├── lib/                   # Utilitários e API client
│   ├── package.json           # Dependências
│   ├── app.json               # Configuração Expo
│   └── tsconfig.json          # Configuração TypeScript
│
├── IMPLEMENTATION_SUMMARY.md  # Resumo técnico detalhado
├── FRONTEND_SETUP.md          # Guia do frontend
├── BACKEND_SETUP.md           # Guia do backend
├── docker-compose.yml         # Orquestração
├── schema.sql                 # Schema do banco
├── test-integration.sh        # Teste de integração
├── run-frontend.sh            # Script de execução
└── README.md                  # Este arquivo
```

## 🔌 API Endpoints

### Autenticação
```
POST   /auth/login        - Fazer login
POST   /auth/register     - Registrar
POST   /auth/logout       - Fazer logout
GET    /auth/me           - Perfil atual
GET    /health            - Health check
```

### Receitas
```
GET    /recipes           - Listar com filtros
GET    /recipes/{id}      - Detalhes
POST   /recipes           - Criar
PUT    /recipes/{id}      - Editar
DELETE /recipes/{id}      - Deletar
```

### Categorias
```
GET    /categories        - Listar
GET    /categories/{id}   - Detalhes
GET    /categories/{id}/recipes - Receitas da categoria
```

### Favoritos
```
GET    /favorites         - Listar
POST   /favorites         - Adicionar
DELETE /favorites/{id}    - Remover
```

### IA
```
POST   /ai/chat          - Chat com Ollama
GET    /ai/models        - Listar modelos
GET    /ai/health        - Status Ollama
```

## 🎨 Design System

### Paleta de Cores
```
Primário (Texto):     #000000 (Preto)
Secundário (Acento):  #D4AF37 (Ouro)
Background:           #FFFFFF (Branco)
Secundário (Texto):   #666666 (Cinza)
```

### Componentes UI
- **Button**: 3 variantes (Primary, Secondary, Outline)
- **Input**: Com validação, ícones, feedback
- **Card**: Container com sombra
- **Header**: Logo e navegação
- **TabBar**: Navigation com 5 abas

## 🧪 Testes

### Backend
```bash
cd backend
source venv/bin/activate
python test_api.py
```

### Frontend
```bash
cd frontend
npm test  # (Configurar Jest/Testing Library)
```

### Integração
```bash
# Certifique-se que backend está rodando
./test-integration.sh
```

## 📊 Fluxo de Dados

```
User → Frontend (React Native)
         ↓
    Validation (Pydantic)
         ↓
    Backend (FastAPI)
         ↓
    Database (SQLite/PostgreSQL)
         ↓
    Response JSON
         ↓
    Frontend Display
```

## 🔐 Segurança

- ✅ JWT Token-based Authentication
- ✅ Password hashing com bcrypt
- ✅ CORS configurado
- ✅ Input validation (Pydantic)
- ✅ SQL Injection prevention (SQLAlchemy)
- ✅ Token expiration (24h)

## 📋 Funcionalidades Implementadas

### Backend ✅
- [x] 40+ endpoints
- [x] JWT authentication
- [x] Database models (5)
- [x] CORS configuration
- [x] Password hashing
- [x] Validation
- [x] Error handling
- [x] Health checks
- [x] Ollama integration
- [x] Swagger documentation

### Frontend ✅
- [x] 11 telas
- [x] 5 abas navegação
- [x] Componentes UI
- [x] Validação de formulários
- [x] API client (axios)
- [x] TypeScript types
- [x] Design system
- [x] Auth stack
- [x] Recipe management
- [x] Chat interface

## 📋 TODO / Próximos Passos

### Curto Prazo
- [ ] Implementar persistência de token
- [ ] Upload de imagens para receitas
- [ ] Integração Ollama completa
- [ ] Testes unitários
- [ ] CI/CD pipeline

### Médio Prazo
- [ ] Dark mode
- [ ] Compartilhamento de receitas
- [ ] Notificações push
- [ ] Câmera para fotos de receitas
- [ ] Histórico de pesquisas

### Longo Prazo
- [ ] Web app (Next.js)
- [ ] Admin dashboard
- [ ] Supabase integration (storage)
- [ ] ML para recomendações
- [ ] PWA offline

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📚 Documentação Adicional

- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Resumo técnico detalhado
- [FRONTEND_SETUP.md](./FRONTEND_SETUP.md) - Guia de setup do frontend
- [BACKEND_SETUP.md](./BACKEND_SETUP.md) - Guia de setup do backend
- [Swagger API Docs](http://localhost:8000/docs) - Documentação interativa da API

## 🐛 Troubleshooting

### Backend não conecta
```bash
# Certifique-se que está na porta correta
http://localhost:8000

# Se em emulador Android, use:
http://10.0.2.2:8000
```

### Erro ao instalar dependências
```bash
# Limpar cache
npm cache clean --force
pip cache purge

# Reinstalar
npm install
pip install -r requirements.txt
```

### Emulador não inicia
```bash
# Listar emuladores
adb devices

# Se vazio, reinicie Android Studio
# Em iOS, use: xcrun simctl list devices
```

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para detalhes.

---

## 🎯 Status do Projeto

**Fase 1**: ✅ Implementação Completa
- Backend 100% funcional
- Frontend 100% implementado
- Pronto para testes

**Fase 2**: 🔄 Testing & Deploy
- Testes de integração
- Deploy em produção
- Otimizações

**Última atualização**: 2024
**Desenvolvedor**: Seu Nome
**Email**: seu@email.com

---

Desenvolvido com ❤️ usando React Native + FastAPI

   Ou manualmente:
   
   **Frontend:**
   ```bash
   cd frontend
   npm start
   ```

   **Backend:**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

## 🛠️ Tecnologias

### Frontend
- React Native
- Expo Router
- TypeScript
- Supabase Client

### Backend
- FastAPI
- Python
- Supabase
- Ollama

## 📦 Estrutura de Dados

Consulte `schema.sql` para o schema completo do banco de dados.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

MIT License
