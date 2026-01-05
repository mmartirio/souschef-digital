#!/bin/bash

# Script para testar integração entre Frontend e Backend
# Certifique-se de que ambos estão rodando antes de executar

echo "========================================="
echo "  SousChef Digital - Integration Test"
echo "========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL base
API_URL="http://localhost:8000"
USER_EMAIL="test@example.com"
USER_PASSWORD="Test@12345"
USER_NAME="Test User"

# Teste 1: Health Check
echo -e "${YELLOW}1. Testando Health Check...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Backend está online${NC}"
else
    echo -e "${RED}✗ Backend não está respondendo${NC}"
    echo "Certifique-se de que o backend está rodando em $API_URL"
    exit 1
fi

echo ""
# Teste 2: Registro de usuário
echo -e "${YELLOW}2. Testando registro de usuário...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST \
  "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$USER_NAME\",
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$USER_PASSWORD\"
  }")

echo "Resposta: $REGISTER_RESPONSE"

echo ""
# Teste 3: Login
echo -e "${YELLOW}3. Testando login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST \
  "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$USER_PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Falha ao fazer login${NC}"
    echo "Resposta: $LOGIN_RESPONSE"
else
    echo -e "${GREEN}✓ Login bem-sucedido${NC}"
    echo "Token: ${TOKEN:0:20}..."
fi

echo ""
# Teste 4: Get current user
echo -e "${YELLOW}4. Testando get current user...${NC}"
ME_RESPONSE=$(curl -s -X GET \
  "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "Resposta: $ME_RESPONSE"

echo ""
# Teste 5: Criar receita
echo -e "${YELLOW}5. Testando criação de receita...${NC}"
RECIPE_RESPONSE=$(curl -s -X POST \
  "$API_URL/recipes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pasta Carbonara",
    "description": "Receita clássica italiana",
    "prep_time": 15,
    "cook_time": 20,
    "servings": 4,
    "difficulty": "medio",
    "instructions": "1. Cozinhe a pasta...",
    "ingredients": [
      {"name": "Macarrão", "quantity": "400", "unit": "g"},
      {"name": "Ovos", "quantity": "3", "unit": "unidade"}
    ]
  }')

echo "Resposta: $RECIPE_RESPONSE"
RECIPE_ID=$(echo $RECIPE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$RECIPE_ID" ]; then
    echo -e "${RED}✗ Falha ao criar receita${NC}"
else
    echo -e "${GREEN}✓ Receita criada com ID: $RECIPE_ID${NC}"
fi

echo ""
# Teste 6: Listar receitas
echo -e "${YELLOW}6. Testando listar receitas...${NC}"
LIST_RESPONSE=$(curl -s -X GET \
  "$API_URL/recipes" \
  -H "Authorization: Bearer $TOKEN")

echo "Resposta: $LIST_RESPONSE"

echo ""
# Teste 7: Obter detalhes da receita
if [ ! -z "$RECIPE_ID" ]; then
    echo -e "${YELLOW}7. Testando detalhes da receita...${NC}"
    DETAIL_RESPONSE=$(curl -s -X GET \
      "$API_URL/recipes/$RECIPE_ID" \
      -H "Authorization: Bearer $TOKEN")

    echo "Resposta: $DETAIL_RESPONSE"
fi

echo ""
# Teste 8: Listar categorias
echo -e "${YELLOW}8. Testando listar categorias...${NC}"
CATEGORIES_RESPONSE=$(curl -s -X GET \
  "$API_URL/categories" \
  -H "Authorization: Bearer $TOKEN")

echo "Resposta: $CATEGORIES_RESPONSE"

echo ""
# Teste 9: Adicionar aos favoritos
if [ ! -z "$RECIPE_ID" ]; then
    echo -e "${YELLOW}9. Testando adicionar aos favoritos...${NC}"
    FAVORITE_RESPONSE=$(curl -s -X POST \
      "$API_URL/favorites" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"recipe_id\": $RECIPE_ID
      }")

    echo "Resposta: $FAVORITE_RESPONSE"
fi

echo ""
# Teste 10: Chat com IA
echo -e "${YELLOW}10. Testando chat com IA...${NC}"
CHAT_RESPONSE=$(curl -s -X POST \
  "$API_URL/ai/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Como fazer um bolo simples?"
  }')

echo "Resposta: $CHAT_RESPONSE"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Testes de integração concluídos!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "✓ Se todos os testes retornaram dados, a integração está funcionando!"
echo ""
echo "Próximos passos:"
echo "1. Executar o frontend: npm start"
echo "2. Escanear QR code com Expo Go"
echo "3. Testar as funcionalidades no app"
echo ""
