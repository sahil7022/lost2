import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import mysql from "mysql2/promise";
import multer from "multer";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "hackathon-secret-key";

// Database Setup
let db: any;
const isMySQL = !!process.env.MYSQL_HOST;

async function initDB() {
  if (isMySQL) {
    console.log("[DB] Using MySQL");
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    db = {
      exec: async (sql: string) => {
        const statements = sql.split(';').filter(s => s.trim());
        for (const s of statements) {
          await pool.query(s);
        }
      },
      prepare: (sql: string) => {
        return {
          run: async (...params: any[]) => {
            const [result] = await pool.execute(sql, params);
            return { lastInsertRowid: (result as any).insertId, changes: (result as any).affectedRows };
          },
          get: async (...params: any[]) => {
            const [rows] = await pool.execute(sql, params);
            return (rows as any[])[0];
          },
          all: async (...params: any[]) => {
            const [rows] = await pool.execute(sql, params);
            return rows as any[];
          }
        };
      }
    };
  } else {
    console.log("[DB] Using SQLite");
    const sqliteDb = new Database("campus_lost_found.db");
    sqliteDb.pragma("foreign_keys = ON");
    
    db = {
      exec: async (sql: string) => sqliteDb.exec(sql),
      prepare: (sql: string) => {
        const stmt = sqliteDb.prepare(sql);
        return {
          run: async (...params: any[]) => {
            const result = stmt.run(...params);
            return { lastInsertRowid: result.lastInsertRowid, changes: result.changes };
          },
          get: async (...params: any[]) => stmt.get(...params),
          all: async (...params: any[]) => stmt.all(...params)
        };
      }
    };
  }

  // Initialize Tables
  if (!isMySQL) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        uucms_number TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'user',
        bio TEXT,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        image_url TEXT,
        type TEXT CHECK(type IN ('lost', 'found')) NOT NULL,
        status TEXT DEFAULT 'pending', -- pending, approved, returned, rejected
        user_id INTEGER,
        date_reported DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER,
        user_id INTEGER,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending', -- pending, verified, rejected
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS follows (
        follower_id INTEGER,
        following_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_id, following_id),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_id INTEGER,
        sender_id INTEGER,
        item_id INTEGER,
        message TEXT NOT NULL,
        type TEXT CHECK(type IN ('FOUND_MATCH', 'CLAIM_REQUEST', 'FOLLOW', 'SYSTEM')) NOT NULL,
        read_status INTEGER DEFAULT 0, -- 0 for unread, 1 for read
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        item_id INTEGER,
        content TEXT NOT NULL,
        read_status INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      );
    `);

    // Migration: Ensure uucms_number column exists in users table
    try {
      await db.exec("ALTER TABLE users ADD COLUMN uucms_number TEXT");
      await db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uucms_number ON users(uucms_number)");
      console.log("[DB] Added uucms_number column and unique index to users table");
    } catch (e: any) {
      if (e.message.includes("duplicate column name")) {
        try {
          await db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uucms_number ON users(uucms_number)");
        } catch {
          // Index might already exist
        }
      }
    }

    // Migration: Ensure status column exists
    try {
      await db.exec("ALTER TABLE items ADD COLUMN status TEXT DEFAULT 'pending'");
    } catch {
      // Column might already exist
    }
  }

  try {
    await seedData();
  } catch (e: any) {
    if (isMySQL) {
      console.warn("[DB] Seeding skipped. If this is a new MySQL database, please import sql.txt via phpMyAdmin first.");
      console.warn("[DB] Error details:", e.message);
    } else {
      console.error("[DB] Seeding error:", e);
    }
  }
}

// Robust Seeding
const seedData = async () => {
  const userCount = await db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    console.log("[DB] Seeding users...");
    const insertUser = db.prepare("INSERT INTO users (id, name, email, password, uucms_number, role, bio, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const userPassword = bcrypt.hashSync('user123', 10);
    await insertUser.run(1, 'Campus Admin', 'admin@campus.edu', adminPassword, 'U15ZR24S0001', 'admin', 'Official Campus Lost & Found Administrator', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin');
    await insertUser.run(2, 'John Doe', 'john@example.com', userPassword, 'U15ZR24S0002', 'user', 'Student at Engineering Dept', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john');
    await insertUser.run(3, 'Jane Smith', 'jane@example.com', userPassword, 'U15ZR24S0003', 'user', 'Arts & Science Major', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane');
    
    const sahilPassword = bcrypt.hashSync('2005', 10);
    await insertUser.run(4, 'Sahil', 'sahil@gmail.com', sahilPassword, 'U15ZR24S0004', 'admin', 'System Administrator', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sahil');
  } else {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    await db.prepare("UPDATE users SET password = ? WHERE id = 1").run(adminPassword);
    
    const sahil = await db.prepare("SELECT * FROM users WHERE email = ?").get('sahil@gmail.com');
    if (!sahil) {
      const sahilPassword = bcrypt.hashSync('2005', 10);
      await db.prepare("INSERT INTO users (name, email, password, uucms_number, role, bio, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run('Sahil', 'sahil@gmail.com', sahilPassword, 'U15ZR24S0004', 'admin', 'System Administrator', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sahil');
    }
  }

  const itemCount = await db.prepare("SELECT COUNT(*) as count FROM items").get() as { count: number };
  if (itemCount.count === 0) {
    console.log("[DB] Seeding items...");
    const insertItem = db.prepare("INSERT INTO items (id, title, description, category, location, type, status, user_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    await insertItem.run(1, 'iPhone 13 Pro', 'Blue iPhone 13 Pro with a clear case. Found near the library entrance.', 'Electronics', 'Main Library', 'found', 'approved', 1, 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&q=80&w=800');
    await insertItem.run(2, 'Blue Backpack', 'North Face backpack containing some notebooks and a water bottle.', 'Others', 'Student Center', 'lost', 'approved', 2, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800');
    await insertItem.run(3, 'Student ID Card', 'ID card belonging to John Doe. Found in the cafeteria.', 'Documents', 'Cafeteria', 'found', 'approved', 3, 'https://images.unsplash.com/photo-1613243555988-441166d4d6fd?auto=format&fit=crop&q=80&w=800');
    await insertItem.run(4, 'MacBook Air M2', 'Silver MacBook Air M2. Left in Room 402.', 'Electronics', 'Science Building', 'lost', 'approved', 2, 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=800');
    await insertItem.run(5, 'Leather Wallet', 'Brown leather wallet with some cash and cards.', 'Wallets', 'Gymnasium', 'found', 'approved', 1, 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800');
  } else {
    await db.prepare("UPDATE items SET status = 'approved' WHERE id IN (1,2,3,4,5) AND status = 'pending'").run();
  }
};

// Helper for notifications
const createNotification = async (recipient_id: number, sender_id: number | null, item_id: number | null, message: string, type: string) => {
  await db.prepare("INSERT INTO notifications (recipient_id, sender_id, item_id, message, type) VALUES (?, ?, ?, ?, ?)")
    .run(recipient_id, sender_id, item_id, message, type);
};

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Multer Setup for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API Routes ---

// Auth
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password, uucms_number } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const info = await db.prepare("INSERT INTO users (name, email, password, uucms_number) VALUES (?, ?, ?, ?)").run(name, email, hashedPassword, uucms_number);
    const token = jwt.sign({ id: info.lastInsertRowid, email, role: 'user' }, JWT_SECRET);
    res.json({ token, user: { id: info.lastInsertRowid, name, email, role: 'user', uucms_number } });
  } catch (e: any) {
    console.error("[Signup Error]", e);
    const errorMessage = e.message.includes('UNIQUE') 
      ? 'Email or UUCMS number already exists' 
      : `Signup failed: ${e.message}`;
    res.status(400).json({ error: errorMessage });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or uucms_number
  const user: any = await db.prepare("SELECT * FROM users WHERE email = ? OR uucms_number = ?").get(identifier, identifier);
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, bio: user.bio, avatar: user.avatar, uucms_number: user.uucms_number } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Users & Social
app.get("/api/users", async (req, res) => {
  const { search } = req.query;
  let query = "SELECT id, name, email, uucms_number, avatar, bio, created_at, role FROM users WHERE 1=1";
  const params: any[] = [];
  if (search) {
    query += " AND (name LIKE ? OR email LIKE ? OR uucms_number LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  const users = await db.prepare(query).all(...params);
  res.json(users);
});

app.get("/api/users/:id", async (req, res) => {
  const user: any = await db.prepare("SELECT id, name, email, uucms_number, avatar, bio, created_at, role FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.sendStatus(404);
  
  const followersCount = await db.prepare("SELECT COUNT(*) as count FROM follows WHERE following_id = ?").get(req.params.id);
  const followingCount = await db.prepare("SELECT COUNT(*) as count FROM follows WHERE follower_id = ?").get(req.params.id);
  
  res.json({ ...user, followersCount: (followersCount as any).count, followingCount: (followingCount as any).count });
});

app.post("/api/users/:id/follow", authenticateToken, async (req: any, res) => {
  try {
    await db.prepare("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)").run(req.user.id, req.params.id);
    await createNotification(parseInt(req.params.id), req.user.id, null, "started following you", "FOLLOW");
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Already following" });
  }
});

app.delete("/api/users/:id/follow", authenticateToken, async (req: any, res) => {
  await db.prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?").run(req.user.id, req.params.id);
  res.json({ success: true });
});

app.get("/api/users/:id/is-following", authenticateToken, async (req: any, res) => {
  const follow = await db.prepare("SELECT * FROM follows WHERE follower_id = ? AND following_id = ?").get(req.user.id, req.params.id);
  res.json({ isFollowing: !!follow });
});

app.get("/api/users/:id/followers", async (req, res) => {
  const followers = await db.prepare(`
    SELECT users.id, users.name, users.email, users.uucms_number, users.avatar, users.bio 
    FROM users 
    JOIN follows ON users.id = follows.follower_id 
    WHERE follows.following_id = ?
  `).all(req.params.id);
  res.json(followers);
});

app.get("/api/users/:id/following", async (req, res) => {
  const following = await db.prepare(`
    SELECT users.id, users.name, users.email, users.uucms_number, users.avatar, users.bio 
    FROM users 
    JOIN follows ON users.id = follows.following_id 
    WHERE follows.follower_id = ?
  `).all(req.params.id);
  res.json(following);
});

// Notifications
app.get("/api/notifications", authenticateToken, async (req: any, res) => {
  const notifications = await db.prepare(`
    SELECT notifications.*, users.name as sender_name, users.avatar as sender_avatar 
    FROM notifications 
    LEFT JOIN users ON notifications.sender_id = users.id 
    WHERE recipient_id = ? 
    ORDER BY created_at DESC
  `).all(req.user.id);
  res.json(notifications);
});

app.put("/api/notifications/:id/read", authenticateToken, async (req: any, res) => {
  await db.prepare("UPDATE notifications SET read_status = 1 WHERE id = ? AND recipient_id = ?").run(req.params.id, req.user.id);
  res.json({ success: true });
});

app.put("/api/notifications/read-all", authenticateToken, async (req: any, res) => {
  await db.prepare("UPDATE notifications SET read_status = 1 WHERE recipient_id = ?").run(req.user.id);
  res.json({ success: true });
});

// Profile
app.get("/api/profile", authenticateToken, async (req: any, res) => {
  const user = await db.prepare("SELECT id, name, email, role, bio, avatar FROM users WHERE id = ?").get(req.user.id);
  res.json(user);
});

app.put("/api/profile", authenticateToken, upload.single("avatar"), async (req: any, res) => {
  const { name, bio } = req.body;
  const avatar = req.file ? `/uploads/${req.file.filename}` : undefined;
  
  if (avatar) {
    await db.prepare("UPDATE users SET name = ?, bio = ?, avatar = ? WHERE id = ?").run(name, bio, avatar, req.user.id);
  } else {
    await db.prepare("UPDATE users SET name = ?, bio = ? WHERE id = ?").run(name, bio, req.user.id);
  }
  res.json({ success: true });
});

// Items
app.get("/api/items", async (req, res) => {
  const { type, category, search, status, userId } = req.query;
  let query = "SELECT items.*, users.name as user_name FROM items JOIN users ON items.user_id = users.id WHERE 1=1";
  const params: any[] = [];

  if (type) { query += " AND type = ?"; params.push(type); }
  if (category) { query += " AND category = ?"; params.push(category); }
  if (status) { query += " AND status = ?"; params.push(status); }
  if (userId) { query += " AND user_id = ?"; params.push(userId); }
  if (search) { 
    query += " AND (title LIKE ? OR description LIKE ? OR category LIKE ?)"; 
    params.push(`%${search}%`, `%${search}%`, `%${search}%`); 
  }

  query += " ORDER BY date_reported DESC";
  const items = await db.prepare(query).all(...params);
  res.json(items);
});

app.get("/api/items/:id", async (req, res) => {
  const item = await db.prepare("SELECT items.*, users.name as user_name FROM items JOIN users ON items.user_id = users.id WHERE items.id = ?").get(req.params.id);
  res.json(item);
});

app.post("/api/items", authenticateToken, upload.single("image"), async (req: any, res) => {
  const { title, description, category, location, type } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const info = await db.prepare("INSERT INTO items (title, description, category, location, type, image_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(title, description, category, location, type, image_url, req.user.id);
  
  // Potential Match Trigger
  if (type === 'found') {
    const matches = await db.prepare("SELECT user_id FROM items WHERE type = 'lost' AND (title LIKE ? OR category = ?) AND status = 'approved'")
      .all(`%${title}%`, category);
    matches.forEach(async (match: any) => {
      if (match.user_id !== req.user.id) {
        await createNotification(match.user_id, req.user.id, info.lastInsertRowid as number, `found an item that might match your lost "${title}"`, "FOUND_MATCH");
      }
    });
  }

  res.json({ id: info.lastInsertRowid });
});

app.delete("/api/items/:id", authenticateToken, async (req: any, res) => {
  const item: any = await db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
  if (!item) return res.sendStatus(404);
  if (item.user_id !== req.user.id && req.user.role !== 'admin') return res.sendStatus(403);
  
  // Manually delete related records if cascade isn't working as expected or to be safe
  await db.prepare("DELETE FROM claims WHERE item_id = ?").run(req.params.id);
  await db.prepare("DELETE FROM notifications WHERE item_id = ?").run(req.params.id);
  await db.prepare("DELETE FROM messages WHERE item_id = ?").run(req.params.id);
  
  await db.prepare("DELETE FROM items WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Claims
app.post("/api/claims", authenticateToken, async (req: any, res) => {
  const { item_id, description } = req.body;
  const item: any = await db.prepare("SELECT user_id, title FROM items WHERE id = ?").get(item_id);
  
  const info = await db.prepare("INSERT INTO claims (item_id, user_id, description) VALUES (?, ?, ?)")
    .run(item_id, req.user.id, description);
  
  if (item) {
    await createNotification(item.user_id, req.user.id, item_id, `submitted a claim for your item: ${item.title}`, "CLAIM_REQUEST");
  }
  res.json({ id: info.lastInsertRowid });
});

// Admin APIs
app.get("/api/admin/stats", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  
  const totalUsers = await db.prepare("SELECT COUNT(*) as count FROM users").get();
  const totalLost = await db.prepare("SELECT COUNT(*) as count FROM items WHERE type = 'lost'").get();
  const totalFound = await db.prepare("SELECT COUNT(*) as count FROM items WHERE type = 'found'").get();
  const totalClaims = await db.prepare("SELECT COUNT(*) as count FROM claims").get();
  
  res.json({
    totalUsers: (totalUsers as any).count,
    totalLost: (totalLost as any).count,
    totalFound: (totalFound as any).count,
    totalClaims: (totalClaims as any).count
  });
});

app.get("/api/admin/claims", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const claims = await db.prepare(`
    SELECT claims.*, items.title as item_title, users.name as user_name 
    FROM claims 
    JOIN items ON claims.item_id = items.id 
    JOIN users ON claims.user_id = users.id
    ORDER BY created_at DESC
  `).all();
  res.json(claims);
});

app.put("/api/admin/items/:id/status", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { status } = req.body;
  await db.prepare("UPDATE items SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ success: true });
});

app.get("/api/admin/audit", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const audit = await db.prepare(`
    SELECT items.id, items.title, items.type, items.status, items.date_reported,
           u_reporter.name as reporter_name,
           claims.user_id as claimer_id, u_claimer.name as claimer_name, claims.status as claim_status
    FROM items
    LEFT JOIN users u_reporter ON items.user_id = u_reporter.id
    LEFT JOIN claims ON items.id = claims.item_id
    LEFT JOIN users u_claimer ON claims.user_id = u_claimer.id
    ORDER BY items.date_reported DESC
  `).all();
  res.json(audit);
});

// Chat APIs
app.get("/api/chat/conversations", authenticateToken, async (req: any, res) => {
  const conversations = await db.prepare(`
    SELECT 
      u.id as other_user_id,
      u.name as other_user_name,
      u.avatar as other_user_avatar,
      m.content as last_message,
      m.created_at as last_message_time,
      (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = ? AND read_status = 0) as unread_count
    FROM users u
    JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = u.id)
    WHERE u.id != ?
    AND m.id = (
      SELECT id FROM messages 
      WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
      ORDER BY created_at DESC LIMIT 1
    )
    ORDER BY m.created_at DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);
  res.json(conversations);
});

app.get("/api/chat/messages/:otherUserId", authenticateToken, async (req: any, res) => {
  const messages = await db.prepare(`
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `).all(req.user.id, req.params.otherUserId, req.params.otherUserId, req.user.id);
  
  // Mark as read
  await db.prepare("UPDATE messages SET read_status = 1 WHERE sender_id = ? AND receiver_id = ?").run(req.params.otherUserId, req.user.id);
  
  res.json(messages);
});

// --- Vite Integration ---
async function startServer() {
  const server = createServer(app);
  
  // WebSocket Server
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Map<number, WebSocket>();

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url!, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      socket.destroy();
      return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        socket.destroy();
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, user);
      });
    });
  });

  wss.on('connection', (ws, user: any) => {
    clients.set(user.id, ws);
    console.log(`[WS] User ${user.id} connected`);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'CHAT_MESSAGE') {
          const { receiver_id, content, item_id } = message;
          const info = await db.prepare("INSERT INTO messages (sender_id, receiver_id, item_id, content) VALUES (?, ?, ?, ?)")
            .run(user.id, receiver_id, item_id || null, content);
          
          const savedMessage = {
            id: info.lastInsertRowid,
            sender_id: user.id,
            receiver_id,
            item_id,
            content,
            created_at: new Date().toISOString(),
            read_status: 0
          };

          // Send to receiver if online
          const receiverWs = clients.get(receiver_id);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({ type: 'NEW_MESSAGE', message: savedMessage }));
          }

          // Send confirmation back to sender
          ws.send(JSON.stringify({ type: 'MESSAGE_SENT', message: savedMessage }));
        }
      } catch (e) {
        console.error('[WS] Error processing message:', e);
      }
    });

    ws.on('close', () => {
      clients.delete(user.id);
      console.log(`[WS] User ${user.id} disconnected`);
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  server.listen(PORT, "0.0.0.0", async () => {
    await initDB();
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
