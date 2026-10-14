import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"
os.environ["SECRET_KEY"] = "test"
os.environ["MEDIA_DIR"] = tempfile.mkdtemp()

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.ollama_service import ollama_service

client = TestClient(app)


def login_headers(email: str) -> dict:
    """Cadastra (se preciso) e autentica um usuário de teste."""
    client.post("/auth/register", json={"email": email, "password": "secret1"})
    token = client.post("/auth/login", data={"username": email, "password": "secret1"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

RECIPE = {
    "title": "Omelete",
    "instructions": "1. Bata os ovos.\n2. Aqueça a frigideira.\n3. Cozinhe por 3 minutos.",
    "difficulty": "easy",
    "ingredients": [{"name": "ovo", "quantity": "2"}],
}


@pytest.fixture(scope="module")
def auth():
    res = client.post("/auth/register", json={"email": "chef@test.com", "password": "secret1"})
    assert res.status_code == 201, res.text
    res = client.post("/auth/login", data={"username": "chef@test.com", "password": "secret1"})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture(autouse=True)
def reset_login_limiter():
    from app.utils.rate_limit import login_limiter
    login_limiter._failures.clear()


def test_health():
    assert client.get("/health").json()["status"] == "healthy"


def test_login_wrong_password(auth):
    res = client.post("/auth/login", data={"username": "chef@test.com", "password": "x"})
    assert res.status_code == 401


def test_recipe_crud_and_favorites(auth):
    assert client.post("/recipes/", json=RECIPE).status_code == 401

    recipe = client.post("/recipes/", json=RECIPE, headers=auth).json()
    assert recipe["ingredients"][0]["name"] == "ovo"

    updated = client.put(f"/recipes/{recipe['id']}", json={"servings": 2}, headers=auth).json()
    assert updated["servings"] == 2 and updated["title"] == "Omelete"

    categories = client.get("/categories/", headers=auth).json()
    assert next(c for c in categories if c["difficulty"] == "easy")["recipe_count"] == 1

    assert client.post("/favorites/", json={"recipe_id": recipe["id"]}, headers=auth).status_code == 204
    assert client.get("/favorites/ids", headers=auth).json() == [recipe["id"]]
    assert client.delete(f"/favorites/{recipe['id']}", headers=auth).status_code == 204

    assert client.delete(f"/recipes/{recipe['id']}", headers=auth).status_code == 204


def test_chat_with_recipe_context(auth, monkeypatch):
    recipe = client.post("/recipes/", json=RECIPE, headers=auth).json()
    captured = {}

    async def fake_chat(messages):
        captured["messages"] = messages
        return "Bata bem os ovos."

    monkeypatch.setattr(ollama_service, "chat", fake_chat)
    res = client.post(
        "/ai/chat",
        headers=login_headers("ia@test.com"),
        json={"messages": [{"role": "user", "content": "Como começo?"}], "recipe_id": recipe["id"]},
    )
    assert res.json()["response"] == "Bata bem os ovos."
    assert "Omelete" in captured["messages"][0]["content"]
    assert captured["messages"][-1] == {"role": "user", "content": "Como começo?"}








def test_knowledge_is_injected_in_prompt(monkeypatch):
    captured = {}

    async def fake_chat(messages):
        captured["system"] = messages[0]["content"]
        return "ok"

    monkeypatch.setattr(ollama_service, "chat", fake_chat)
    client.post(
        "/ai/chat",
        headers=login_headers("ia@test.com"), json={"messages": [{"role": "user", "content": "Como substituir ovo no bolo?"}]})
    assert "linhaça" in captured["system"]


def test_google_login_creates_and_links_account(monkeypatch):
    from app.services.google_auth_service import GoogleIdentity, google_auth_service

    async def fake_verify(token):
        return GoogleIdentity(email="chef@test.com", name="Chef") if token == "valid" else None

    monkeypatch.setattr(google_auth_service, "client_ids", {"client"})
    monkeypatch.setattr(google_auth_service, "verify", fake_verify)

    assert client.post("/auth/google", json={"id_token": "bad"}).status_code == 401
    res = client.post("/auth/google", json={"id_token": "valid"})
    assert res.status_code == 200 and res.json()["user"]["email"] == "chef@test.com"
    res = client.post("/auth/google", json={"id_token": "valid"})  # mesmo usuário, sem duplicar
    assert res.json()["user"]["id"] == client.post("/auth/google", json={"id_token": "valid"}).json()["user"]["id"]


def test_seed_recipes_is_idempotent_and_feeds_the_agent(monkeypatch):
    from app.database.connection import SessionLocal
    from app.services.recipes import seed_recipes

    from app.models.recipe import Recipe
    from app.models.user import User
    from app.models.user import BOOK_AUTHOR_EMAIL

    with SessionLocal() as db:
        seed_recipes(db)
        assert seed_recipes(db) == 0  # sincronizado: nada a criar nem atualizar
        author = db.query(User).filter_by(email=BOOK_AUTHOR_EMAIL).one()
        assert db.query(Recipe).filter_by(user_id=author.id).count() >= 190

    captured = {}

    async def fake_chat(messages):
        captured["system"] = messages[0]["content"]
        return "ok"

    monkeypatch.setattr(ollama_service, "chat", fake_chat)
    client.post(
        "/ai/chat",
        headers=login_headers("ia@test.com"), json={"messages": [{"role": "user", "content": "como faço baiao de dois?"}]})
    assert "Baião de dois" in captured["system"] and "feijão-de-corda" in captured["system"]


def test_profile_name_avatar_password_and_account_deletion():
    res = client.post("/auth/register", json={"email": "perfil@test.com", "password": "secret1"})
    h = {"Authorization": f"Bearer {res.json()['access_token']}"}

    assert client.put("/users/me", json={"full_name": "Ana Chef"}, headers=h).json()["full_name"] == "Ana Chef"

    bad = client.put("/users/me/avatar", files={"file": ("a.txt", b"x", "text/plain")}, headers=h)
    assert bad.status_code == 400
    avatar = client.put("/users/me/avatar", files={"file": ("a.png", b"\x89PNG fake", "image/png")}, headers=h).json()["avatar_url"]
    assert client.get(avatar, headers=h).content == b"\x89PNG fake"

    assert client.put("/users/me", json={"current_password": "errada", "new_password": "nova123"}, headers=h).status_code == 400
    assert client.put("/users/me", json={"current_password": "secret1", "new_password": "nova123"}, headers=h).status_code == 200
    assert client.post("/auth/login", data={"username": "perfil@test.com", "password": "nova123"}).status_code == 200

    client.post("/recipes/", json=RECIPE, headers=h)
    assert client.delete("/users/me", headers=h).status_code == 204
    from app.routes.users import MEDIA_DIR
    assert not (MEDIA_DIR / avatar.rsplit("/", 1)[-1]).exists()  # foto apagada junto com a conta
    assert client.get("/auth/me", headers=h).status_code == 401
    # email liberado para novo cadastro
    assert client.post("/auth/register", json={"email": "perfil@test.com", "password": "secret1"}).status_code == 201



def test_recipe_details_only_when_title_is_cited():
    from app.database.connection import SessionLocal
    from app.routes.ai import build_system_prompt

    with SessionLocal() as db:
        cited = build_system_prompt(db, "como faço brigadeiro?", None)
        loose = build_system_prompt(db, "quero fazer um bolo", None)
    assert "Receita do app citada na pergunta" in cited and "leite condensado" in cited
    assert "Receita do app citada" not in loose and "Receitas no app com nome parecido" in loose


def test_filter_recipes_by_country():
    from app.database.connection import SessionLocal
    from app.services.recipes import seed_recipes

    with SessionLocal() as db:
        seed_recipes(db)
    h = login_headers("pais@test.com")
    countries = {c["country"]: c["recipe_count"] for c in client.get("/recipes/countries", headers=h).json()}
    assert countries["Brasil"] > countries["França"] > 0
    french = client.get("/recipes/", headers=h, params={"country": "França", "limit": 100}).json()
    assert "Croque monsieur" in {r["title"] for r in french}
    assert all(r["country"] == "França" for r in french)


def test_find_recipe_by_spoken_request():
    from app.database.connection import SessionLocal
    from app.services.recipes import seed_recipes

    with SessionLocal() as db:
        seed_recipes(db)
    found = client.get("/ai/find-recipe", headers=login_headers("ia@test.com"), params={"q": "quero fazer bolo matilda"}).json()
    assert found["match"]["title"] == "Bolo Matilda"
    # parte do nome basta quando nenhuma outra receita casa com as mesmas palavras
    assert client.get("/ai/find-recipe", headers=login_headers("ia@test.com"), params={"q": "nordestino"}).json()["match"]["title"] == "Cuscuz nordestino"
    assert client.get("/ai/find-recipe", headers=login_headers("ia@test.com"), params={"q": "bolo de cenoura"}).json()["match"]["title"].startswith("Bolo de cenoura")
    cuscuz = client.get("/ai/find-recipe", headers=login_headers("ia@test.com"), params={"q": "quero uma receita de cuscuz"}).json()
    assert cuscuz["match"] is None
    assert {"Cuscuz nordestino", "Cuscuz marroquino com legumes"} <= {o["title"] for o in cuscuz["options"]}
    ambiguous = client.get("/ai/find-recipe", headers=login_headers("ia@test.com"), params={"q": "quero fazer um bolo"}).json()
    assert ambiguous["match"] is None and len(ambiguous["options"]) > 1


def test_book_recipe_editable_and_kept_by_seed():
    from app.database.connection import SessionLocal
    from app.services.recipes import seed_recipes

    with SessionLocal() as db:
        seed_recipes(db)
    res = client.post("/auth/register", json={"email": "editor@test.com", "password": "secret1"})
    h = {"Authorization": f"Bearer {res.json()['access_token']}"}
    recipe = next(r for r in client.get("/recipes/", headers=h, params={"search": "Brigadeiro"}).json() if r["title"] == "Brigadeiro")
    assert recipe["from_book"]

    edited = client.put(f"/recipes/{recipe['id']}", json={"servings": 40}, headers=h)
    assert edited.status_code == 200 and edited.json()["servings"] == 40
    with SessionLocal() as db:
        seed_recipes(db)  # sincronização não desfaz a edição
    assert client.get(f"/recipes/{recipe['id']}", headers=h).json()["servings"] == 40
    # excluir continua restrito ao autor
    assert client.delete(f"/recipes/{recipe['id']}", headers=h).status_code == 403


def test_ai_routes_require_login():
    assert client.post("/ai/chat", json={"messages": [{"role": "user", "content": "oi"}]}).status_code == 401
    assert client.get("/ai/find-recipe", params={"q": "brigadeiro"}).status_code == 401
    assert client.post("/ai/transcribe", files={"file": ("a.wav", b"x", "audio/wav")}).status_code == 401


def test_upload_limit_is_enforced(monkeypatch):
    from app.routes import users

    monkeypatch.setattr(users, "MAX_AVATAR_BYTES", 10)
    res = client.put("/users/me/avatar", headers=login_headers("upload@test.com"),
                     files={"file": ("a.png", b"x" * 11, "image/png")})
    assert res.status_code == 413


def test_sync_snapshot_last_write_wins_and_idempotent_create():
    h = login_headers("sync@test.com")
    body = {"title": "Offline", "instructions": "1. Teste.", "client_ref": "cel-123"}
    first = client.post("/recipes/", json=body, headers=h).json()
    again = client.post("/recipes/", json=body, headers=h).json()
    assert again["id"] == first["id"]  # reenvio não duplica

    client.post("/favorites/", json={"recipe_id": first["id"]}, headers=h)
    snapshot = client.get("/recipes/sync", headers=h).json()
    assert first["id"] in snapshot["favorite_ids"]
    assert any(r["id"] == first["id"] and r["updated_at"] for r in snapshot["recipes"])

    # edição antiga (feita offline antes da versão atual do servidor) não sobrescreve
    stale = client.put(f"/recipes/{first['id']}", headers=h,
                       json={"servings": 9, "client_updated_at": "2000-01-01T00:00:00Z"}).json()
    assert stale["servings"] is None
    fresh = client.put(f"/recipes/{first['id']}", headers=h,
                       json={"servings": 9, "client_updated_at": "2999-01-01T00:00:00Z"}).json()
    assert fresh["servings"] == 9

    # remover favorito duas vezes não falha (reenvio offline)
    assert client.delete(f"/favorites/{first['id']}", headers=h).status_code == 204
    assert client.delete(f"/favorites/{first['id']}", headers=h).status_code == 204
    assert client.get("/recipes/sync").status_code == 401


def test_offline_create_then_edit_keeps_the_edit():
    """Criada e editada offline: ao sincronizar, a edição (feita depois) não é descartada."""
    h = login_headers("offline@test.com")
    created = client.post("/recipes/", headers=h, json={
        "title": "Rascunho", "instructions": "1. A.", "client_ref": "cel-offline-1",
        "client_updated_at": "2026-01-01T10:00:00Z"}).json()
    edited = client.put(f"/recipes/{created['id']}", headers=h, json={
        "title": "Final", "client_updated_at": "2026-01-01T10:05:00Z"}).json()
    assert edited["title"] == "Final"


def test_every_data_route_requires_login():
    for method, path in [("get", "/recipes/"), ("get", "/recipes/1"), ("get", "/recipes/countries"),
                         ("get", "/categories/"), ("get", "/favorites/"), ("get", "/ai/health"),
                         ("get", "/ai/models"), ("get", "/media/avatar_1_x.png")]:
        assert getattr(client, method)(path).status_code == 401, path
    assert client.get("/docs").status_code == 404  # documentação desligada por padrão


def test_avatar_only_visible_to_owner():
    owner, other = login_headers("dono@test.com"), login_headers("outro@test.com")
    avatar = client.put("/users/me/avatar", headers=owner,
                        files={"file": ("a.png", b"\x89PNG", "image/png")}).json()["avatar_url"]
    assert client.get(avatar, headers=owner).status_code == 200
    assert client.get(avatar, headers=other).status_code == 404


def test_login_blocked_after_repeated_failures():
    client.post("/auth/register", json={"email": "bruta@test.com", "password": "secret1"})
    for _ in range(5):
        client.post("/auth/login", data={"username": "bruta@test.com", "password": "errada"})
    blocked = client.post("/auth/login", data={"username": "bruta@test.com", "password": "secret1"})
    assert blocked.status_code == 429
