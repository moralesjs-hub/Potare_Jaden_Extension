import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { setDb, initUserTable, addUser, saveProfileSettings, getProfileSettings, deleteUser } from "../services/user_services.ts";
import { setBarDb, initBarTable, addCircleMember, createCircle, deleteCircle, getCircles, recordCheckIn, getActiveCheckInIds, leaveVenue, setCircleTarget, seedBars } from "../services/bar_services.ts";
import { bars_data } from "../database/data.ts";

function createAdapter() {
  const connection = new DatabaseSync(":memory:");
  const adapter = {
    execAsync: async (sql) => connection.exec(sql),
    runAsync: async (sql, ...params) => {
      const result = connection.prepare(sql).run(...params);
      return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
    },
    getFirstAsync: async (sql, ...params) => connection.prepare(sql).get(...params) ?? null,
    getAllAsync: async (sql, ...params) => connection.prepare(sql).all(...params),
    close: () => connection.close(),
  };
  return adapter;
}

test("SQLite migration adds discovery columns to an existing venue table", async () => {
  const db = createAdapter(); setDb(db); setBarDb(db);
  try {
    await initUserTable();
    await db.execAsync(`CREATE TABLE bar (id INTEGER PRIMARY KEY, name TEXT NOT NULL, address TEXT, latitude REAL, longitude REAL, rating REAL, notes TEXT); INSERT INTO bar (name) VALUES ('Legacy venue');`);
    await initBarTable();
    const columns = await db.getAllAsync(`PRAGMA table_info(bar)`);
    const names = columns.map((column) => column.name);
    assert.ok(names.includes("category"));
    assert.ok(names.includes("crowdLevel"));
    assert.ok(names.includes("priceTier"));
    assert.equal((await db.getFirstAsync(`SELECT priceTier FROM bar WHERE name = ?`, "Legacy venue")).priceTier, 2);
  } finally { db.close(); }
});

test("SQLite circle permissions, activity privacy, target, and cascade behavior work", async () => {
  const db = createAdapter(); setDb(db); setBarDb(db);
  try {
    await initUserTable(); await initBarTable();
    await addUser({ username: "host", email: "host@test.local", hashedPassword: "x" });
    await addUser({ username: "guest", email: "guest@test.local", hashedPassword: "x" });
    await db.runAsync(`INSERT INTO bar (name, latitude, longitude) VALUES (?, ?, ?)`, "Test venue", 32, -79);
    const host = Number((await db.getFirstAsync(`SELECT id FROM user WHERE username = ?`, "host")).id);
    const guest = Number((await db.getFirstAsync(`SELECT id FROM user WHERE username = ?`, "guest")).id);
    const circleId = await createCircle(host, "Saturday night");

    await assert.rejects(addCircleMember(circleId, host, "guest"), /not discoverable/);
    await saveProfileSettings(guest, { bio: "Hello", discoverable: true, activityVisible: false });
    await addCircleMember(circleId, host, "guest");
    await assert.rejects(addCircleMember(circleId, guest, "host"), /host can invite/);

    await recordCheckIn(guest, 1);
    await setCircleTarget(circleId, host, 1);
    let [circle] = await getCircles(host);
    assert.equal(circle.targetName, "Test venue");
    assert.equal(circle.members.find((member) => member.id === guest).venue, null);

    await saveProfileSettings(guest, { bio: "Hello", discoverable: true, activityVisible: true });
    [circle] = await getCircles(host);
    assert.equal(circle.members.find((member) => member.id === guest).venue, "Test venue");
    await deleteUser(host);
    assert.deepEqual(await getCircles(host), []);
  } finally { db.close(); }
});

test("profile privacy settings default closed and persist across reads", async () => {
  const db = createAdapter(); setDb(db); setBarDb(db);
  try {
    await initUserTable();
    await addUser({ username: "private", email: "private@test.local", hashedPassword: "x" });
    const id = Number((await db.getFirstAsync(`SELECT id FROM user WHERE username = ?`, "private")).id);
    assert.deepEqual(await getProfileSettings(id), { bio: "", discoverable: false, activityVisible: false });
    const expected = { bio: "Night owl", discoverable: true, activityVisible: false };
    await saveProfileSettings(id, expected);
    assert.deepEqual(await getProfileSettings(id), expected);
  } finally { db.close(); }
});

test("demo venue seed updates existing rows and inserts the complete supplied records once", async () => {
  const db = createAdapter(); setDb(db); setBarDb(db);
  try {
    await initUserTable(); await initBarTable();
    await db.runAsync(`INSERT INTO bar (name, address, latitude, longitude) VALUES (?, ?, ?, ?)`, "Burns Alley Tavern", "Old address", 32.7, -79.9);
    await seedBars(bars_data);
    await seedBars(bars_data);
    assert.equal((await db.getFirstAsync(`SELECT COUNT(*) AS count FROM bar`)).count, bars_data.length);
    const updated = await db.getFirstAsync(`SELECT address, latitude, category FROM bar WHERE name = ?`, "Burns Alley Tavern");
    assert.equal(updated.address, "354B King St, Charleston, SC 29401");
    assert.equal(updated.latitude, 32.7, "preserve an existing verified coordinate");
    assert.equal(updated.category, "Tavern");
    const notGeocoded = await db.getFirstAsync(`SELECT latitude, longitude FROM bar WHERE name = ?`, "The Griffon");
    assert.equal(notGeocoded.latitude, null);
    assert.equal(notGeocoded.longitude, null);
  } finally { db.close(); }
});

test("arrival activates a venue and leaving clears its active map state", async () => {
  const db = createAdapter(); setDb(db); setBarDb(db);
  try {
    await initUserTable(); await initBarTable();
    await addUser({ username: "visitor", email: "visitor@test.local", hashedPassword: "x" });
    const userId = Number((await db.getFirstAsync(`SELECT id FROM user WHERE username = ?`, "visitor")).id);
    await db.runAsync(`INSERT INTO bar (name) VALUES (?)`, "First bar");
    await db.runAsync(`INSERT INTO bar (name) VALUES (?)`, "Next bar");
    await recordCheckIn(userId, 1);
    assert.deepEqual(await getActiveCheckInIds(userId), [1]);
    await recordCheckIn(userId, 2);
    assert.deepEqual(await getActiveCheckInIds(userId), [2]);
    await leaveVenue(userId, 2);
    assert.deepEqual(await getActiveCheckInIds(userId), []);
  } finally { db.close(); }
});

test("only the outing owner can delete an outing", async () => {
  const db = createAdapter(); setDb(db); setBarDb(db);
  try {
    await initUserTable(); await initBarTable();
    await addUser({ username: "owner", email: "owner-delete@test.local", hashedPassword: "x" });
    await addUser({ username: "other", email: "other-delete@test.local", hashedPassword: "x" });
    const ownerId = Number((await db.getFirstAsync(`SELECT id FROM user WHERE username = ?`, "owner")).id);
    const otherId = Number((await db.getFirstAsync(`SELECT id FROM user WHERE username = ?`, "other")).id);
    const id = await createCircle(ownerId, "Delete me");
    assert.equal(await deleteCircle(id, otherId), false);
    assert.equal((await getCircles(ownerId)).length, 1);
    assert.equal(await deleteCircle(id, ownerId), true);
    assert.deepEqual(await getCircles(ownerId), []);
  } finally { db.close(); }
});
