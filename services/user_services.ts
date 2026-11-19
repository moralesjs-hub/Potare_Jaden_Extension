import type * as SQLite from "expo-sqlite";
import type { User, UserCreate, UserResponse } from "../types/user";

let db: SQLite.SQLiteDatabase;

export const setDb = (database: SQLite.SQLiteDatabase) => {
  db = database;
};

type UserRow = { id: number; username: string; email: string; hashedPassword: string; stats: string | null };

const mapUserResponse = (row: UserRow): UserResponse => ({
  id: row.id,
  username: row.username,
  email: row.email,
  stats: row.stats ? JSON.parse(row.stats) : null,
});

const mapUser = (row: UserRow): User => ({
  id: row.id,
  username: row.username,
  email: row.email,
  hashedPassword: row.hashedPassword,
  stats: row.stats ? JSON.parse(row.stats) : null,
});

export const initUserTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      hashedPassword TEXT NOT NULL,
      stats TEXT
    );
    CREATE TABLE IF NOT EXISTS profile_settings (
      userId INTEGER PRIMARY KEY,
      bio TEXT NOT NULL DEFAULT '',
      discoverable INTEGER NOT NULL DEFAULT 0,
      activityVisible INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    );
  `);
};

export type ProfileSettings = { bio: string; discoverable: boolean; activityVisible: boolean };

export const getProfileSettings = async (userId: number): Promise<ProfileSettings> => {
  const row = await db.getFirstAsync<{ bio: string; discoverable: number; activityVisible: number }>(
    `SELECT bio, discoverable, activityVisible FROM profile_settings WHERE userId = ?`, userId
  );
  return { bio: row?.bio ?? "", discoverable: row?.discoverable === 1, activityVisible: row?.activityVisible === 1 };
};

export const saveProfileSettings = async (userId: number, settings: ProfileSettings): Promise<void> => {
  await db.runAsync(
    `INSERT INTO profile_settings (userId, bio, discoverable, activityVisible) VALUES (?, ?, ?, ?)
     ON CONFLICT(userId) DO UPDATE SET bio = excluded.bio, discoverable = excluded.discoverable, activityVisible = excluded.activityVisible`,
    userId, settings.bio.trim(), Number(settings.discoverable), Number(settings.activityVisible)
  );
};

export const addUser = async (user: UserCreate) => {
  await db.runAsync(
    `INSERT INTO user (username, email, hashedPassword, stats) VALUES (?, ?, ?, ?)`,
    user.username,
    user.email.toLowerCase(),
    user.hashedPassword,
    user.stats ? JSON.stringify(user.stats) : null
  );
};

export const getUsers = async (): Promise<UserResponse[]> => {
  const rows = await db.getAllAsync<UserRow>(`SELECT * FROM user ORDER BY id DESC`);
  return rows.map(mapUserResponse);
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const row = await db.getFirstAsync(
    `SELECT * FROM user WHERE email = ?`,
    email.toLowerCase()
  ) as UserRow | null;
  return row ? mapUser(row) : null;
};

export const getUserById = async (id: number): Promise<UserResponse | null> => {
  const row = await db.getFirstAsync<UserRow>(`SELECT * FROM user WHERE id = ?`, id);
  return row ? mapUserResponse(row) : null;
};

export const updateUsername = async (id: number, username: string): Promise<void> => {
  await db.runAsync(`UPDATE user SET username = ? WHERE id = ?`, username.trim(), id);
};

export const updateUser = async (user: User) => {
  await db.runAsync(
    `UPDATE user SET username = ?, email = ?, hashedPassword = ?, stats = ? WHERE id = ?`,
    user.username,
    user.email.toLowerCase(),
    user.hashedPassword,
    user.stats ? JSON.stringify(user.stats) : null,
    user.id
  );
};

export const deleteUser = async (userId: number) => {
  await db.runAsync(`DELETE FROM user WHERE id = ?`, userId);
};
