# SousChef Digital - Backend API

API REST desenvolvida com FastAPI para o sistema SousChef Digital.

## 🚀 Funcionalidades Implementadas

### ✅ Autenticação
- Registro de usuários com validação de email e senha forte
- Login com JWT tokens
- Proteção de rotas com autenticação
- Middleware de autenticação

### ✅ Usuários
- Perfil de usuário
- Atualização de dados pessoais
- Alteração de senha
- Soft delete de contas

### ✅ Receitas
- CRUD completo de receitas
- Ingredientes associados
- Filtros por dificuldade, usuário e busca textual
- Listagem de receitas do usuário logado

### ✅ Categorias
- Categorias baseadas em dificuldade
- Contagem de receitas por categoria
- Estatísticas personalizadas

### ✅ Favoritos
- Adicionar receitas aos favoritos
- Listar favoritos
- Remover favoritos
- Verificar se receita está favoritada

### ✅ Assistente IA (Ollama)
- Geração de texto com IA
- Chat conversacional
- Sugestão de receitas baseada em ingredientes
- Análise de receitas existentes
- Sugestão de substituições de ingredientes
- Dicas de culinária

### ✅ Utilitários
- Validação de email
- Validação de senha forte
- Formatação de tempo
- Geração de slugs
- Sanitização de strings
- Paginação

## 📋 Pré-requisitos

- Python 3.11+
- Ollama instalado (para funcionalidades de IA)

## 🔧 Instalação

1. **Instale as dependências:**
```bash
pip install -r requirements.txt
```

2. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:
- `SECRET_KEY`: Chave secreta para JWT
- `DATABASE_URL`: URL do banco de dados
- `OLLAMA_URL`: URL do serviço Ollama

3. **Execute o servidor:**
```bash
uvicorn app.main:app --reload
```

Ou:
```bash
python -m app.main
```

## 🧪 Testando a API

### Via Swagger UI
Acesse: http://localhost:8000/docs

### Via Script de Teste
```bash
python test_api.py
```

### Manualmente com curl

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Registrar Usuário:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "SenhaForte123",
    "full_name": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=SenhaForte123"
```

**Criar Receita:**
```bash
curl -X POST http://localhost:8000/recipes/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "title": "Bolo de Chocolate",
    "description": "Delicioso bolo",
    "instructions": "Misture e asse",
    "prep_time": 15,
    "cook_time": 30,
    "servings": 8,
    "difficulty": "medium",
    "ingredients": [
      {"name": "Farinha", "quantity": "2 xícaras"},
      {"name": "Açúcar", "quantity": "1 xícara"}
    ]
  }'
```

## 📁 Estrutura do Projeto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Aplicação FastAPI principal
│   ├── database/
│   │   ├── __init__.py
│   │   └── connection.py    # Configuração do banco de dados
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py          # Modelo de usuário
│   │   ├── recipe.py        # Modelo de receita e ingredientes
│   │   ├── category.py      # Modelo de categoria
│   │   └── favorite.py      # Modelo de favoritos
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py          # Rotas de autenticação
│   │   ├── users.py         # Rotas de usuários
│   │   ├── recipes.py       # Rotas de receitas
│   │   ├── categories.py    # Rotas de categorias
│   │   ├── favorites.py     # Rotas de favoritos
│   │   └── ai.py            # Rotas de IA
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ollama_service.py    # Serviço Ollama
│   │   └── supabase_service.py  # Serviço Supabase (vazio)
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py          # Middleware de autenticação
│   │   └── tenant.py        # Middleware de tenant
│   └── utils/
│       ├── __init__.py
│       ├── security.py      # Utilitários de segurança
│       └── helpers.py       # Funções auxiliares
├── .env.example             # Exemplo de variáveis de ambiente
├── requirements.txt         # Dependências Python
├── Dockerfile              # Container Docker
└── test_api.py             # Script de testes
```

## 🔐 Segurança

- Senhas com hash bcrypt
- Tokens JWT para autenticação
- Validação de senha forte (mínimo 8 caracteres, maiúsculas, minúsculas e números)
- Validação de email
- CORS configurado
- Middleware de autenticação

## 🗃️ Banco de Dados

O projeto usa SQLAlchemy com suporte para:
- SQLite (padrão para desenvolvimento)
- PostgreSQL (recomendado para produção)

As tabelas são criadas automaticamente na inicialização.

## 🤖 Integração com Ollama

O serviço de IA requer o Ollama rodando localmente ou remotamente.

**Instalar Ollama:**
```bash
# Linux/Mac
curl https://ollama.ai/install.sh | sh

# Baixar modelo
ollama pull llama2
```

**Configurar:**
Defina `OLLAMA_URL` no arquivo `.env`

## 📝 Endpoints Principais

### Autenticação
- `POST /auth/register` - Registrar usuário
- `POST /auth/login` - Login
- `GET /auth/me` - Usuário atual
- `POST /auth/logout` - Logout

### Usuários
- `GET /users/` - Listar usuários
- `GET /users/{id}` - Buscar usuário
- `PUT /users/me` - Atualizar perfil
- `DELETE /users/me` - Deletar conta

### Receitas
- `POST /recipes/` - Criar receita
- `GET /recipes/` - Listar receitas
- `GET /recipes/{id}` - Buscar receita
- `PUT /recipes/{id}` - Atualizar receita
- `DELETE /recipes/{id}` - Deletar receita
- `GET /recipes/user/me` - Minhas receitas

### Favoritos
- `POST /favorites/` - Adicionar favorito
- `GET /favorites/` - Listar favoritos
- `DELETE /favorites/{recipe_id}` - Remover favorito
- `GET /favorites/check/{recipe_id}` - Verificar favorito

### IA
- `POST /ai/generate` - Gerar texto
- `POST /ai/chat` - Chat com IA
- `POST /ai/suggest-recipe` - Sugerir receita
- `POST /ai/analyze-recipe/{id}` - Analisar receita
- `POST /ai/substitute-ingredient` - Substituir ingrediente
- `GET /ai/cooking-tips` - Dicas de culinária

### Categorias
- `GET /categories/` - Listar categorias
- `GET /categories/{id}/recipes` - Receitas por categoria
- `GET /categories/stats` - Estatísticas

## 🐳 Docker

```bash
# Build
docker build -t souschef-backend .

# Run
docker run -p 8000:8000 souschef-backend
```

## 📄 Licença

Este projeto é parte do SousChef Digital.
