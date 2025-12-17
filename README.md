# 🍳 SousChef Digital

Assistente culinário inteligente com IA, desenvolvido com React Native (Expo) e FastAPI.

## 📋 Características

- 🔐 Autenticação com Supabase
- 📱 Interface mobile com Expo Router
- 🤖 Assistente IA com Ollama
- 📖 Gerenciamento de receitas
- 🏷️ Categorização de receitas
- ⭐ Favoritos
- 🔍 Busca inteligente

## 🏗️ Estrutura do Projeto

```
souschef-digital/
├── frontend/          # App React Native com Expo
├── backend/           # API FastAPI
├── docker-compose.yml # Orquestração de containers
└── schema.sql         # Schema do banco de dados
```

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+
- Python 3.11+
- Docker (opcional)
- Conta no Supabase

### Configuração Rápida

1. Clone o repositório
2. Execute o script de inicialização:
   ```bash
   chmod +x init-project.sh
   ./init-project.sh
   ```

3. Configure as variáveis de ambiente:
   - `frontend/.env`
   - `backend/.env`

4. Execute com Docker:
   ```bash
   docker-compose up
   ```

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
