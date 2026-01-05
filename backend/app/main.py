from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.routes import auth, users, recipes, categories, ai, favorites
from app.database.connection import get_db, Base, engine
from app.middleware.auth import AuthMiddleware
from app.middleware.tenant import TenantMiddleware

# Importa os modelos para garantir que sejam criados no banco de dados
from app.models import user, recipe, category, favorite

# Cria as tabelas no banco de dados
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SousChef Digital API",
    description="API para o sistema SousChef Digital, gerenciando usuários e receitas.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "SousChef Digital API",
        "status": "running", 
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Verifica a saúde da API e a conexão com o banco de dados."""
    try:
        # Tenta executar uma consulta simples para verificar a conexão com o banco de dados
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Database error: {str(e)}"
        )

# Inclui rotas
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(recipes.router, prefix="/recipes", tags=["recipes"])
app.include_router(categories.router, prefix="/categories", tags=["categories"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(favorites.router, prefix="/favorites", tags=["favorites"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)