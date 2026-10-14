# Database connection
import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from dotenv import load_dotenv

#Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

#URL de conexão com o banco de dados
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./souschef.db")

#Cria o motor de conexão com o banco de dados
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})

#Cria uma sessão local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#Base declarativa para os modelos do banco de dados
Base = declarative_base()

#Dependência para obter a sessão do banco de dados
def get_db():
    """Fornece uma sessão do banco de dados para cada requisição.
    Fecha a sessão após o uso.
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Colunas adicionadas depois da criação das tabelas (create_all não altera tabelas existentes)
ADDED_COLUMNS = {
    "users": {"avatar_url": "VARCHAR"},
    "recipes": {
        "country": "VARCHAR",
        "customized": "BOOLEAN NOT NULL DEFAULT FALSE",
        "client_ref": "VARCHAR",
    },
}
ADDED_INDEXES = ["CREATE UNIQUE INDEX IF NOT EXISTS ix_recipes_client_ref ON recipes (client_ref)"]


def migrate():
    """Adiciona colunas novas em bancos já existentes."""
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table, columns in ADDED_COLUMNS.items():
            existing = {c["name"] for c in inspector.get_columns(table)}
            for name, sql_type in columns.items():
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {sql_type}"))
        for statement in ADDED_INDEXES:
            conn.execute(text(statement))
