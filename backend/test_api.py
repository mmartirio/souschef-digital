"""
Script simples para testar a API localmente.
Execute: python test_api.py
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Testa o endpoint de health check"""
    print("\n🔍 Testando Health Check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_register_user():
    """Testa registro de usuário"""
    print("\n📝 Testando Registro de Usuário...")
    data = {
        "email": "teste@example.com",
        "username": "teste_user",
        "password": "SenhaForte123",
        "full_name": "Usuário Teste"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 201

def test_login():
    """Testa login de usuário"""
    print("\n🔐 Testando Login...")
    data = {
        "username": "teste_user",
        "password": "SenhaForte123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", data=data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        token_data = response.json()
        print(f"Token recebido: {token_data['access_token'][:50]}...")
        return token_data['access_token']
    return None

def test_create_recipe(token):
    """Testa criação de receita"""
    print("\n🍳 Testando Criação de Receita...")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": "Bolo de Chocolate",
        "description": "Um delicioso bolo de chocolate",
        "instructions": "1. Misture os ingredientes\n2. Asse por 30 minutos",
        "prep_time": 15,
        "cook_time": 30,
        "servings": 8,
        "difficulty": "medium",
        "ingredients": [
            {"name": "Farinha de trigo", "quantity": "2 xícaras"},
            {"name": "Chocolate em pó", "quantity": "1 xícara"},
            {"name": "Ovos", "quantity": "3 unidades"}
        ]
    }
    response = requests.post(f"{BASE_URL}/recipes/", json=data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 201

def test_get_recipes():
    """Testa listagem de receitas"""
    print("\n📖 Testando Listagem de Receitas...")
    response = requests.get(f"{BASE_URL}/recipes/")
    print(f"Status: {response.status_code}")
    recipes = response.json()
    print(f"Total de receitas: {len(recipes)}")
    return response.status_code == 200

def test_categories():
    """Testa listagem de categorias"""
    print("\n🏷️  Testando Categorias...")
    response = requests.get(f"{BASE_URL}/categories/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def run_all_tests():
    """Executa todos os testes"""
    print("=" * 60)
    print("🧪 INICIANDO TESTES DA API")
    print("=" * 60)
    
    results = {}
    
    # Test 1: Health Check
    results['health'] = test_health_check()
    
    # Test 2: Register
    results['register'] = test_register_user()
    
    # Test 3: Login
    token = test_login()
    results['login'] = token is not None
    
    if token:
        # Test 4: Create Recipe
        results['create_recipe'] = test_create_recipe(token)
    
    # Test 5: List Recipes
    results['list_recipes'] = test_get_recipes()
    
    # Test 6: Categories
    results['categories'] = test_categories()
    
    # Resumo
    print("\n" + "=" * 60)
    print("📊 RESUMO DOS TESTES")
    print("=" * 60)
    for test_name, passed in results.items():
        status = "✅ PASSOU" if passed else "❌ FALHOU"
        print(f"{test_name}: {status}")
    
    total = len(results)
    passed = sum(results.values())
    print(f"\nTotal: {passed}/{total} testes passaram")
    print("=" * 60)

if __name__ == "__main__":
    try:
        run_all_tests()
    except requests.exceptions.ConnectionError:
        print("❌ ERRO: Não foi possível conectar à API.")
        print("Certifique-se de que o servidor está rodando em http://localhost:8000")
    except Exception as e:
        print(f"❌ ERRO: {str(e)}")
