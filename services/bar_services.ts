import type * as SQLite from "expo-sqlite";
import type { Bar, BarCreate, BarResponse } from "../types/bar";

let db: SQLite.SQLiteDatabase;

export const setBarDb = (database: SQLite.SQLiteDatabase) => {
  db = database;
};

export const initBarTable = async () => {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS bar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      latitude REAL,
      longitude REAL,
      rating REAL,
      notes TEXT,
      category TEXT NOT NULL DEFAULT 'Bar',
      crowdLevel TEXT NOT NULL DEFAULT 'Moderate',
      priceTier INTEGER NOT NULL DEFAULT 2 CHECK (priceTier BETWEEN 1 AND 3)
    );
    CREATE TABLE IF NOT EXISTS favorite (
      userId INTEGER NOT NULL,
      barId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (userId, barId),
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (barId) REFERENCES bar(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS check_in (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      barId INTEGER NOT NULL,
      checkedInAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      leftAt TEXT,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (barId) REFERENCES bar(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS circle (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ownerId INTEGER NOT NULL,
      targetBarId INTEGER,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ownerId) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (targetBarId) REFERENCES bar(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS circle_member (
      circleId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      joinedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (circleId, userId),
      FOREIGN KEY (circleId) REFERENCES circle(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    );
  `);
  const checkInColumns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(check_in)`);
  if (!checkInColumns.some((column) => column.name === "leftAt")) {
    await db.execAsync(`ALTER TABLE check_in ADD COLUMN leftAt TEXT`);
    await db.execAsync(`UPDATE check_in SET leftAt = checkedInAt WHERE id NOT IN (SELECT MAX(id) FROM check_in GROUP BY userId)`);
  }
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(bar)`);
  const existing = new Set(columns.map((column) => column.name));
  if (!existing.has("category")) await db.execAsync(`ALTER TABLE bar ADD COLUMN category TEXT NOT NULL DEFAULT 'Bar'`);
  if (!existing.has("crowdLevel")) await db.execAsync(`ALTER TABLE bar ADD COLUMN crowdLevel TEXT NOT NULL DEFAULT 'Moderate'`);
  if (!existing.has("priceTier")) await db.execAsync(`ALTER TABLE bar ADD COLUMN priceTier INTEGER NOT NULL DEFAULT 2`);
};

export type Circle = {
  id: number;
  name: string;
  ownerId: number;
  targetBarId: number | null;
  targetName: string | null;
  createdAt: string;
  members: { id: number; username: string; venue: string | null; lastActive: string | null }[];
};

export const createCircle = async (ownerId: number, name: string): Promise<number> => {
  const result = await db.runAsync(`INSERT INTO circle (name, ownerId) VALUES (?, ?)`, name.trim(), ownerId);
  await db.runAsync(`INSERT INTO circle_member (circleId, userId) VALUES (?, ?)`, result.lastInsertRowId, ownerId);
  return result.lastInsertRowId;
};

export const deleteCircle = async (circleId: number, ownerId: number): Promise<boolean> => {
  const result = await db.runAsync(`DELETE FROM circle WHERE id = ? AND ownerId = ?`, circleId, ownerId);
  return result.changes > 0;
};

export const getCircles = async (userId: number): Promise<Circle[]> => {
  const rows = await db.getAllAsync<Omit<Circle, "members">>(
    `SELECT c.id, c.name, c.ownerId, c.targetBarId, b.name AS targetName, c.createdAt
     FROM circle c LEFT JOIN bar b ON b.id = c.targetBarId
     JOIN circle_member mine ON mine.circleId = c.id
     WHERE mine.userId = ? ORDER BY c.createdAt DESC`, userId
  );
  return Promise.all(rows.map(async (circle) => ({
    ...circle,
    targetBarId: circle.targetBarId ?? null,
    targetName: circle.targetName ?? null,
    members: await db.getAllAsync<Circle["members"][number]>(
      `SELECT u.id, u.username,
         CASE WHEN COALESCE(ps.activityVisible, 0) = 1 THEN b.name ELSE NULL END AS venue,
         CASE WHEN COALESCE(ps.activityVisible, 0) = 1 THEN ci.checkedInAt ELSE NULL END AS lastActive
       FROM circle_member cm JOIN user u ON u.id = cm.userId
       LEFT JOIN check_in ci ON ci.id = (SELECT MAX(id) FROM check_in WHERE userId = u.id)
       LEFT JOIN bar b ON b.id = ci.barId
       LEFT JOIN profile_settings ps ON ps.userId = u.id
       WHERE cm.circleId = ? ORDER BY u.username`, circle.id
    ),
  })));
};

export const addCircleMember = async (circleId: number, ownerId: number, username: string): Promise<void> => {
  const ownsCircle = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM circle WHERE id = ? AND ownerId = ?`, circleId, ownerId
  );
  if (!ownsCircle) throw new Error("Only the outing host can invite members.");
  const existing = await db.getFirstAsync<{ userId: number }>(
    `SELECT userId FROM circle_member WHERE circleId = ? AND userId = (SELECT id FROM user WHERE username = ?)`,
    circleId, username.trim()
  );
  if (existing) return;
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO circle_member (circleId, userId)
     SELECT ?, id FROM user WHERE username = ?
       AND EXISTS (SELECT 1 FROM profile_settings WHERE userId = user.id AND discoverable = 1)
       AND EXISTS
       (SELECT 1 FROM circle WHERE id = ? AND ownerId = ?)`,
    circleId, username.trim(), circleId, ownerId
  );
  if (result.changes === 0) throw new Error("User is not discoverable or outing is not owned by current user.");
};

export const setCircleTarget = async (circleId: number, ownerId: number, barId: number | null): Promise<void> => {
  await db.runAsync(`UPDATE circle SET targetBarId = ? WHERE id = ? AND ownerId = ?`, barId, circleId, ownerId);
};

type BarRow = { id: number; name: string; address: string | null; latitude: number | null; longitude: number | null; rating: number | null; notes: string | null; category: string; crowdLevel: "Quiet" | "Moderate" | "Lively"; priceTier: 1 | 2 | 3 };

const mapBar = (row: BarRow): BarResponse => ({
  id: row.id,
  name: row.name,
  address: row.address ?? null,
  latitude: row.latitude ?? null,
  longitude: row.longitude ?? null,
  rating: row.rating ?? null,
  notes: row.notes ?? null,
  category: row.category ?? "Bar",
  crowdLevel: row.crowdLevel ?? "Moderate",
  priceTier: row.priceTier ?? 2,
});

export const getBars = async (): Promise<BarResponse[]> => {
  const rows = await db.getAllAsync<BarRow>(`SELECT * FROM bar ORDER BY name ASC`);
  return rows.map(mapBar);
};

export const getBarById = async (id: number): Promise<BarResponse | null> => {
  const row = await db.getFirstAsync<BarRow>(`SELECT * FROM bar WHERE id = ?`, id);
  return row ? mapBar(row) : null;
};

export const addBar = async (bar: BarCreate): Promise<void> => {
  await db.runAsync(
    `INSERT INTO bar (name, address, latitude, longitude, rating, notes, category, crowdLevel, priceTier)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    bar.name,
    bar.address ?? null,
    bar.latitude ?? null,
    bar.longitude ?? null,
    bar.rating ?? null,
    bar.notes ?? null,
    bar.category ?? "Bar",
    bar.crowdLevel ?? "Moderate",
    bar.priceTier ?? 2
  );
};

export const updateBar = async (bar: Bar): Promise<void> => {
  await db.runAsync(
    `UPDATE bar SET name = ?, address = ?, latitude = ?, longitude = ?, rating = ?, notes = ?
     WHERE id = ?`,
    bar.name,
    bar.address ?? null,
    bar.latitude ?? null,
    bar.longitude ?? null,
    bar.rating ?? null,
    bar.notes ?? null,
    bar.id
  );
};

export const updateBarCoordinates = async (
  id: number,
  latitude: number,
  longitude: number
): Promise<void> => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) return;
  await db.runAsync(
    `UPDATE bar SET latitude = ?, longitude = ? WHERE id = ?
     AND (latitude IS NULL OR longitude IS NULL OR latitude = 0 OR longitude = 0)`,
    latitude, longitude, id
  );
};

export const deleteBar = async (id: number): Promise<void> => {
  await db.runAsync(`DELETE FROM bar WHERE id = ?`, id);
};

export const seedBars = async (bars: BarCreate[]): Promise<void> => {
  for (const bar of bars) {
    const latitude = bar.latitude === 0 ? null : bar.latitude ?? null;
    const longitude = bar.longitude === 0 ? null : bar.longitude ?? null;
    const existing = await db.getFirstAsync<{ id: number }>(`SELECT id FROM bar WHERE name = ?`, bar.name);
    if (!existing) {
      await addBar({ ...bar, latitude, longitude });
      continue;
    }
    await db.runAsync(
      `UPDATE bar SET address = ?,
         latitude = CASE WHEN latitude = 0 THEN ? ELSE COALESCE(latitude, ?) END,
         longitude = CASE WHEN longitude = 0 THEN ? ELSE COALESCE(longitude, ?) END,
         category = ?, crowdLevel = ?, priceTier = ? WHERE id = ?`,
      bar.address ?? null, latitude, latitude, longitude, longitude,
      bar.category ?? "Bar", bar.crowdLevel ?? "Moderate", bar.priceTier ?? 2, existing.id
    );
  }
};

export const recordCheckIn = async (userId: number, barId: number): Promise<void> => {
  await db.runAsync(`UPDATE check_in SET leftAt = CURRENT_TIMESTAMP WHERE userId = ? AND leftAt IS NULL`, userId);
  await db.runAsync(
    `INSERT INTO check_in (userId, barId) VALUES (?, ?)`,
    userId,
    barId
  );
};

export const leaveVenue = async (userId: number, barId: number): Promise<void> => {
  await db.runAsync(
    `UPDATE check_in SET leftAt = CURRENT_TIMESTAMP WHERE userId = ? AND barId = ? AND leftAt IS NULL`,
    userId,
    barId
  );
};

export const getActiveCheckInIds = async (userId: number): Promise<number[]> => {
  const rows = await db.getAllAsync<{ barId: number }>(
    `SELECT barId FROM check_in WHERE userId = ? AND leftAt IS NULL ORDER BY id DESC`, userId
  );
  return rows.map((row) => row.barId);
};

export const getCheckIns = async (userId: number) => {
  return db.getAllAsync<{ id: number; userId: number; barId: number; checkedInAt: string; name: string }>(
    `SELECT check_in.id, check_in.userId, check_in.barId, check_in.checkedInAt, bar.name
     FROM check_in JOIN bar ON bar.id = check_in.barId
     WHERE check_in.userId = ? ORDER BY check_in.checkedInAt DESC`,
    userId
  );
};

export const toggleFavorite = async (userId: number, barId: number): Promise<boolean> => {
  const row = await db.getFirstAsync<{ barId: number }>(
    `SELECT barId FROM favorite WHERE userId = ? AND barId = ?`, userId, barId
  );
  if (row) {
    await db.runAsync(`DELETE FROM favorite WHERE userId = ? AND barId = ?`, userId, barId);
    return false;
  }
  await db.runAsync(`INSERT INTO favorite (userId, barId) VALUES (?, ?)`, userId, barId);
  return true;
};

export const getFavoriteIds = async (userId: number): Promise<number[]> => {
  const rows = await db.getAllAsync<{ barId: number }>(
    `SELECT barId FROM favorite WHERE userId = ?`, userId
  );
  return rows.map((row) => row.barId);
};

export const geocodeAddress = async (
  address: string
): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const query = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { "User-Agent": "PotareApp/1.0" } }
    );
    const data = await res.json();
    if (data.length === 0) return null;
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
};

export const backfillCoords = async (): Promise<void> => {
  const all = await getBars();
  for (const bar of all) {
    if (bar.latitude != null || !bar.address) continue;
    const coords = await geocodeAddress(bar.address);
    if (coords) {
      await updateBar({ ...bar, ...coords });
    }
  }
};
