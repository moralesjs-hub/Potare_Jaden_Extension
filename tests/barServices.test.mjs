import test from "node:test";
import assert from "node:assert/strict";
import { setBarDb, recordCheckIn, toggleFavorite, getFavoriteIds } from "../services/bar_services.ts";

test("check-in service uses bound values", async () => {
  const calls = [];
  setBarDb({ runAsync: async (...args) => { calls.push(args); return { lastInsertRowId: 1 }; } });
  await recordCheckIn(8, 3);
  assert.deepEqual(calls[0], ["UPDATE check_in SET leftAt = CURRENT_TIMESTAMP WHERE userId = ? AND leftAt IS NULL", 8]);
  assert.deepEqual(calls[1], ["INSERT INTO check_in (userId, barId) VALUES (?, ?)", 8, 3]);
});

test("favorite toggles are idempotent in the expected direction", async () => {
  const favorites = new Set();
  setBarDb({
    getFirstAsync: async (_sql, userId, barId) => favorites.has(`${userId}:${barId}`) ? { barId } : null,
    getAllAsync: async () => [...favorites].map((key) => ({ barId: Number(key.split(":")[1]) })),
    runAsync: async (sql, userId, barId) => {
      if (sql.startsWith("INSERT")) favorites.add(`${userId}:${barId}`);
      else favorites.delete(`${userId}:${barId}`);
      return { lastInsertRowId: 1 };
    },
  });
  assert.equal(await toggleFavorite(2, 7), true);
  assert.deepEqual(await getFavoriteIds(2), [7]);
  assert.equal(await toggleFavorite(2, 7), false);
  assert.deepEqual(await getFavoriteIds(2), []);
});
