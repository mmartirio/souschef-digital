"""Copia os dados de um banco SQLite para o banco configurado em DATABASE_URL (ex.: PostgreSQL).

Uso (dentro do container do backend):
    python -m app.database.copy_sqlite /app/data/souschef.db

O banco de destino precisa estar vazio; as tabelas são criadas se não existirem.
Mantém os ids e ajusta as sequências do PostgreSQL para os próximos registros.
"""
import sys

from sqlalchemy import create_engine, func, select, text

from app import models  # noqa: F401  (registra os modelos no metadata)
from app.database.connection import Base, engine, migrate

TABLES = ["users", "recipes", "ingredients", "favorites"]  # ordem das chaves estrangeiras


def copy(sqlite_path: str) -> None:
    source = create_engine(f"sqlite:///{sqlite_path}")
    Base.metadata.create_all(bind=engine)
    migrate()
    with source.connect() as src, engine.begin() as dst:
        for name in TABLES:
            table = Base.metadata.tables[name]
            if dst.execute(select(func.count()).select_from(table)).scalar():
                raise SystemExit(f"A tabela {name} do destino não está vazia; nada foi copiado.")
            source_columns = set(src.execute(text(f"SELECT * FROM {name} LIMIT 0")).keys())
            columns = [c for c in table.columns if c.name in source_columns]
            rows = [dict(row._mapping) for row in src.execute(select(*columns).select_from(table))]
            if rows:
                dst.execute(table.insert(), rows)
            if engine.dialect.name == "postgresql":
                dst.execute(text(
                    f"SELECT setval(pg_get_serial_sequence('{name}', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM {name}"
                ))
            print(f"{name}: {len(rows)} registros")


if __name__ == "__main__":
    copy(sys.argv[1])
