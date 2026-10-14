import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import type { Recipe } from './types';

/**
 * Banco local do celular (SQLite criptografado com SQLCipher): é nele que o app lê e grava.
 * Alterações ficam na fila `outbox` até serem enviadas ao servidor (PostgreSQL) — ver `lib/sync.ts`.
 */
export type OutboxAction = 'create' | 'update' | 'delete' | 'favorite' | 'unfavorite';

export interface OutboxEntry {
  seq: number;
  action: OutboxAction;
  recipe_id: number;
  payload: string | null;
}

const DB_NAME = 'souschef.db';
const KEY_NAME = 'local_db_key';

/** Chave do SQLCipher: 256 bits aleatórios, gerados no 1º uso e guardados no Keystore. */
async function databaseKey(): Promise<string> {
  const saved = await SecureStore.getItemAsync(KEY_NAME);
  if (saved) return saved;
  const key = Array.from(Crypto.getRandomBytes(32), (b) => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(KEY_NAME, key);
  return key;
}

async function openEncrypted(key: string) {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  try {
    await db.execAsync(`PRAGMA key = "x'${key}'";`);
    await db.getFirstAsync('SELECT count(*) FROM sqlite_master'); // falha se a chave não abre o arquivo
    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}

/** Abre o banco criptografado; um arquivo antigo sem criptografia (ou de outra chave) é recriado. */
async function open() {
  const key = await databaseKey();
  let db: SQLite.SQLiteDatabase;
  try {
    db = await openEncrypted(key);
  } catch {
    await SQLite.deleteDatabaseAsync(DB_NAME).catch(() => undefined);
    db = await openEncrypted(key);
  }
  await db.execAsync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS recipes (id INTEGER PRIMARY KEY NOT NULL, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS favorites (recipe_id INTEGER PRIMARY KEY NOT NULL);
  CREATE TABLE IF NOT EXISTS outbox (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    recipe_id INTEGER NOT NULL,
    payload TEXT
  );
`);
  return db;
}

const ready = open();

/** Acesso ao banco já inicializado. */
export function localDb() {
  return ready;
}

export async function readRecipes(): Promise<Recipe[]> {
  const rows = await (await localDb()).getAllAsync<{ data: string }>('SELECT data FROM recipes');
  return rows.map((row) => JSON.parse(row.data) as Recipe);
}

export async function readRecipe(id: number): Promise<Recipe | null> {
  const row = await (await localDb()).getFirstAsync<{ data: string }>('SELECT data FROM recipes WHERE id = ?', id);
  return row ? (JSON.parse(row.data) as Recipe) : null;
}

export async function readFavoriteIds(): Promise<Set<number>> {
  const rows = await (await localDb()).getAllAsync<{ recipe_id: number }>('SELECT recipe_id FROM favorites');
  return new Set(rows.map((row) => row.recipe_id));
}

export async function readOutbox(): Promise<OutboxEntry[]> {
  return (await localDb()).getAllAsync<OutboxEntry>('SELECT * FROM outbox ORDER BY seq');
}

/** Apaga todos os dados locais (ex.: ao sair da conta). */
export async function clearLocalData(): Promise<void> {
  await (await localDb()).execAsync('DELETE FROM recipes; DELETE FROM favorites; DELETE FROM outbox;');
}
