# Database connection
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

#Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

#URL de conexão com o banco de dados
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

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
        