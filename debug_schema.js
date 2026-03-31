import Database from 'better-sqlite3';

const db = new Database('campus_lost_found.db');

// Get notifications schema
const result = db.prepare("SELECT sql FROM sqlite_master WHERE name='notifications'").get();
const schema = result ? result.sql : "NOT_FOUND";
const hasCheck = schema.includes("CHECK");

// Try inserting SYSTEM type with FK off
db.pragma("foreign_keys = OFF");
let insertResult = "unknown";
try {
  const info = db.prepare("INSERT INTO notifications (recipient_id, sender_id, item_id, message, type) VALUES (1, NULL, NULL, 'test', 'SYSTEM')").run();
  insertResult = "OK";
  db.prepare("DELETE FROM notifications WHERE id = ?").run(info.lastInsertRowid);
} catch (e) {
  insertResult = "FAIL:" + e.message;
}

// List items
const allItems = db.prepare("SELECT id, user_id, status FROM items LIMIT 10").all();

// List users  
const users = db.prepare("SELECT id, name, role FROM users").all();

db.close();

// Write as JSON for grep compatibility
const output = {
  hasCheckConstraint: hasCheck,
  systemInsert: insertResult,
  items: allItems,
  users: users
};

process.stdout.write(JSON.stringify(output));
