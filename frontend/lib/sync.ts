import { AppState } from 'react-native';
import { isAxiosError } from 'axios';
import { syncAPI } from './api';
import { localDb, OutboxEntry, readOutbox } from './localDb';
import { notifyLocalChange, setSyncTrigger } from './localStore';
import type { Recipe } from './types';

/**
 * Sincronização banco local (SQLite) → servidor (PostgreSQL):
 * 1. envia a fila de alterações na ordem em que foram feitas;
 * 2. baixa a versão do servidor, sem sobrescrever o que ainda está na fila.
 * Conflito: vale a última alteração (o servidor compara com `client_updated_at`).
 */

const RETRY_INTERVAL_MS = 30_000;

/** Sem resposta do servidor (offline) ou falha temporária: tentar de novo mais tarde. */
const isTemporary = (error: unknown) =>
  !isAxiosError(error) || !error.response || error.response.status >= 500 || error.response.status === 401;

async function send(entry: OutboxEntry): Promise<Recipe | void> {
  const payload = entry.payload ? JSON.parse(entry.payload) : undefined;
  switch (entry.action) {
    case 'create':
      return syncAPI.createRecipe(payload);
    case 'update':
      return syncAPI.updateRecipe(entry.recipe_id, payload);
    case 'delete':
      return syncAPI.deleteRecipe(entry.recipe_id);
    case 'favorite':
      return syncAPI.addFavorite(entry.recipe_id);
    case 'unfavorite':
      return syncAPI.removeFavorite(entry.recipe_id);
  }
}

/** Tira a entrada enviada da fila e grava a versão que o servidor devolveu (se houver). */
async function commitSent(entry: OutboxEntry, saved: Recipe | void) {
  const db = await localDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM outbox WHERE seq = ?', entry.seq);
    if (!saved) return;
    if (saved.id !== entry.recipe_id) {
      // Receita criada offline: troca o id temporário pelo definitivo em todas as tabelas.
      await db.runAsync('DELETE FROM recipes WHERE id = ?', entry.recipe_id);
      await db.runAsync('UPDATE favorites SET recipe_id = ? WHERE recipe_id = ?', saved.id, entry.recipe_id);
      await db.runAsync('UPDATE outbox SET recipe_id = ? WHERE recipe_id = ?', saved.id, entry.recipe_id);
    }
    // Outra alteração local dessa receita ainda na fila: ela prevalece sobre esta resposta.
    const newer = await db.getFirstAsync('SELECT 1 FROM outbox WHERE recipe_id = ?', saved.id);
    if (!newer) await db.runAsync('INSERT OR REPLACE INTO recipes (id, data) VALUES (?, ?)', saved.id, JSON.stringify(saved));
  });
}

/** Envia a fila. Retorna false se parou por falta de conexão. */
async function push(): Promise<boolean> {
  const db = await localDb();
  for (const { seq } of await readOutbox()) {
    // Relê a entrada: um envio anterior pode ter trocado o id temporário da receita.
    const entry = await db.getFirstAsync<OutboxEntry>('SELECT * FROM outbox WHERE seq = ?', seq);
    if (!entry) continue;
    try {
      await commitSent(entry, await send(entry));
    } catch (error) {
      if (isTemporary(error)) return false;
      // Recusado pelo servidor (ex.: receita apagada por outro aparelho): não há como reenviar.
      console.warn('Sincronização: alteração descartada', entry.action, entry.recipe_id, error);
      await db.runAsync('DELETE FROM outbox WHERE seq = ?', entry.seq);
    }
  }
  return true;
}

/** Baixa o servidor para o banco local, preservando o que ainda está na fila. */
async function pull() {
  const snapshot = await syncAPI.snapshot();
  const db = await localDb();
  await db.withTransactionAsync(async () => {
    const pending = await db.getAllAsync<{ recipe_id: number; action: string }>('SELECT recipe_id, action FROM outbox');
    const pendingIds = new Set(pending.map((p) => p.recipe_id));
    const serverIds = new Set(snapshot.recipes.map((r) => r.id));

    for (const recipe of snapshot.recipes) {
      if (!pendingIds.has(recipe.id)) {
        await db.runAsync('INSERT OR REPLACE INTO recipes (id, data) VALUES (?, ?)', recipe.id, JSON.stringify(recipe));
      }
    }
    // Apagadas no servidor (ids positivos sem alteração local pendente).
    const localIds = await db.getAllAsync<{ id: number }>('SELECT id FROM recipes WHERE id > 0');
    for (const { id } of localIds) {
      if (!serverIds.has(id) && !pendingIds.has(id)) await db.runAsync('DELETE FROM recipes WHERE id = ?', id);
    }

    // Favoritos: os do servidor, com as marcações locais ainda na fila aplicadas por cima.
    const favorites = new Set(snapshot.favorite_ids);
    for (const { recipe_id, action } of pending) {
      if (action === 'favorite') favorites.add(recipe_id);
      if (action === 'unfavorite') favorites.delete(recipe_id);
    }
    await db.runAsync('DELETE FROM favorites');
    for (const id of favorites) await db.runAsync('INSERT OR IGNORE INTO favorites (recipe_id) VALUES (?)', id);
  });
}

let running: Promise<void> | null = null;

/** Envia a fila e baixa as novidades. Chamadas simultâneas reaproveitam a que está em andamento. */
export function syncNow(): Promise<void> {
  running ??= (async () => {
    try {
      if (await push()) await pull();
      notifyLocalChange();
    } catch {
      // Sem conexão: os dados continuam no banco local e a fila é reenviada depois.
    } finally {
      running = null;
    }
  })();
  return running;
}

/** Liga a sincronização automática (ao entrar, a cada 30 s e ao voltar para o app). Retorna o desligamento. */
export function startSync(): () => void {
  setSyncTrigger(() => void syncNow());
  void syncNow();
  const timer = setInterval(() => void syncNow(), RETRY_INTERVAL_MS);
  const appState = AppState.addEventListener('change', (state) => state === 'active' && void syncNow());
  return () => {
    setSyncTrigger(() => undefined);
    clearInterval(timer);
    appState.remove();
  };
}
