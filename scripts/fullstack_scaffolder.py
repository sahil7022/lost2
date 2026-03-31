#!/usr/bin/env python3
"""
Fullstack Scaffolder — Campus Lost & Found
Generates: API Route + React Page + DB Schema + Types + Admin Panel
Usage: python scripts/fullstack_scaffolder.py --feature <name> [--with-admin] [--dry-run]
"""
import argparse, os, sys, textwrap
from datetime import datetime
from pathlib import Path

C_R="\033[0m";C_B="\033[1m";C_D="\033[2m";C_RED="\033[91m";C_GRN="\033[92m"
C_YLW="\033[93m";C_BLU="\033[94m";C_MAG="\033[95m";C_CYN="\033[96m"

def find_root():
    p = Path(__file__).resolve().parent
    for _ in range(5):
        if (p/"package.json").exists(): return p
        p = p.parent
    print(f"{C_RED}✖ No package.json found{C_R}"); sys.exit(1)

ROOT = find_root(); SRC = ROOT/"src"
def to_pascal(s): return "".join(w.capitalize() for w in s.replace("-","_").split("_"))
def to_title(s): return " ".join(w.capitalize() for w in s.replace("-","_").split("_"))

TEMPLATES = {
    "rewards":       {"desc":"User rewards/points system","fields":[("title","TEXT"),("points","INTEGER"),("description","TEXT"),("status","TEXT DEFAULT 'active'")]},
    "analytics":     {"desc":"Dashboard analytics module","fields":[("metric_name","TEXT"),("metric_value","INTEGER"),("category","TEXT"),("period","TEXT DEFAULT 'daily'")]},
    "announcements": {"desc":"Campus announcements system","fields":[("title","TEXT"),("content","TEXT"),("priority","TEXT DEFAULT 'normal'"),("expires_at","DATETIME"),("is_pinned","INTEGER DEFAULT 0")]},
    "locations":     {"desc":"Campus location directory","fields":[("name","TEXT"),("description","TEXT"),("building","TEXT"),("floor","TEXT"),("latitude","REAL"),("longitude","REAL")]},
    "feedback":      {"desc":"User feedback & ratings","fields":[("subject","TEXT"),("content","TEXT"),("rating","INTEGER"),("category","TEXT DEFAULT 'general'"),("status","TEXT DEFAULT 'open'")]},
}

def write_file(fp, content, dry_run=False):
    rel = fp.relative_to(ROOT)
    if fp.exists():
        print(f"  {C_YLW}⚠ SKIP{C_R}  {rel}  {C_D}(exists){C_R}"); return False
    if dry_run:
        print(f"  {C_BLU}◦ DRY {C_R}  {rel}"); return True
    fp.parent.mkdir(parents=True, exist_ok=True)
    fp.write_text(content, encoding="utf-8")
    print(f"  {C_GRN}✔ NEW {C_R}  {rel}"); return True

def gen_sql(name, fields):
    plural = name.lower()+"s"
    cols = "\n".join(f"  {n} {t}," for n,t in fields)
    return f"""-- Table: {plural} | Generated: {datetime.now():%Y-%m-%d %H:%M}
CREATE TABLE IF NOT EXISTS {plural} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
{cols}
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
"""

def gen_api(name):
    p=name.lower()+"s"; P=to_pascal(name)
    return f"""// API Routes: {P} | Generated: {datetime.now():%Y-%m-%d %H:%M}

// GET /api/{p}
app.get("/api/{p}", async (req, res) => {{
  const {{ search }} = req.query;
  let query = "SELECT * FROM {p} WHERE 1=1";
  const params: any[] = [];
  if (search) {{ query += " AND (title LIKE ? OR description LIKE ?)"; params.push(`%${{search}}%`, `%${{search}}%`); }}
  query += " ORDER BY created_at DESC";
  res.json(await db.prepare(query).all(...params));
}});

// GET /api/{p}/:id
app.get("/api/{p}/:id", async (req, res) => {{
  const item = await db.prepare("SELECT * FROM {p} WHERE id = ?").get(req.params.id);
  if (!item) return res.sendStatus(404);
  res.json(item);
}});

// POST /api/{p}
app.post("/api/{p}", authenticateToken, async (req: any, res) => {{
  const {{ title, description }} = req.body;
  try {{
    const info = await db.prepare("INSERT INTO {p} (title, description, user_id) VALUES (?, ?, ?)").run(title, description, req.user.id);
    res.json({{ id: info.lastInsertRowid }});
  }} catch (e: any) {{ res.status(400).json({{ error: e.message }}); }}
}});

// DELETE /api/{p}/:id
app.delete("/api/{p}/:id", authenticateToken, async (req: any, res) => {{
  const item: any = await db.prepare("SELECT * FROM {p} WHERE id = ?").get(req.params.id);
  if (!item) return res.sendStatus(404);
  if (Number(item.user_id) !== Number(req.user.id) && req.user.role !== 'admin') return res.sendStatus(403);
  await db.prepare("DELETE FROM {p} WHERE id = ?").run(req.params.id);
  res.json({{ success: true }});
}});
"""

def gen_page(name):
    P=to_pascal(name); T=to_title(name); p=name.lower()+"s"
    return f"""import {{ useState, useEffect }} from 'react';
import {{ motion }} from 'motion/react';
import {{ toast }} from 'sonner';
import api from '../services/api';

export default function {P}() {{
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {{ fetchData(); }}, []);

  const fetchData = async () => {{
    try {{ setLoading(true); const res = await api.get('/api/{p}'); setData(res.data); }}
    catch (err) {{ toast.error('Failed to load {T}'); }}
    finally {{ setLoading(false); }}
  }};

  const filtered = data.filter((item: any) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{{{ opacity: 0, y: 20 }}}} animate={{{{ opacity: 1, y: 0 }}}} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{T}</h1>
          <p className="text-zinc-400 mt-1">Manage and view all {T.lower()} entries</p>
        </div>
        <input type="text" placeholder="Search..." value={{search}} onChange={{(e) => setSearch(e.target.value)}}
          className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-full sm:w-64" />
      </div>
      {{loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-500"><p className="text-lg">No {T.lower()} found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {{filtered.map((item: any, i: number) => (
            <motion.div key={{item.id || i}} initial={{{{ opacity: 0, y: 10 }}}} animate={{{{ opacity: 1, y: 0 }}}} transition={{{{ delay: i * 0.05 }}}}
              className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-5 backdrop-blur-sm hover:border-purple-500/30 transition-all">
              <pre className="text-xs text-zinc-400 overflow-auto">{{JSON.stringify(item, null, 2)}}</pre>
            </motion.div>
          ))}}
        </div>
      )}}
    </motion.div>
  );
}}
"""

def gen_admin(name):
    P=to_pascal(name); T=to_title(name); p=name.lower()+"s"
    return f"""import {{ useState, useEffect }} from 'react';
import {{ toast }} from 'sonner';
import api from '../../services/api';

export default function Admin{P}() {{
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {{ fetchItems(); }}, []);
  const fetchItems = async () => {{
    try {{ const res = await api.get('/api/{p}'); setItems(res.data); }}
    catch (err) {{ toast.error('Failed to load {T.lower()}'); }}
    finally {{ setLoading(false); }}
  }};
  const handleDelete = async (id: number) => {{
    if (!confirm('Delete this {name.lower()}?')) return;
    try {{ await api.delete(`/api/{p}/${{id}}`); toast.success('Deleted'); fetchItems(); }}
    catch (err) {{ toast.error('Failed to delete'); }}
  }};

  if (loading) return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500" /></div>;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Manage {T}</h2>
        <span className="text-sm text-zinc-400">{{items.length}} total</span>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-zinc-800/50 text-zinc-400">
            <th className="text-left p-4">ID</th><th className="text-left p-4">Title</th>
            <th className="text-left p-4">Created</th><th className="text-right p-4">Actions</th>
          </tr></thead>
          <tbody>{{items.map((item: any) => (
            <tr key={{item.id}} className="border-b border-zinc-800/30 hover:bg-zinc-800/30">
              <td className="p-4 text-zinc-300">#{{item.id}}</td>
              <td className="p-4 text-white font-medium">{{item.title||'Untitled'}}</td>
              <td className="p-4 text-zinc-400">{{new Date(item.created_at).toLocaleDateString()}}</td>
              <td className="p-4 text-right">
                <button onClick={{() => handleDelete(item.id)}} className="text-red-400 hover:text-red-300 text-xs px-3 py-1 rounded-lg hover:bg-red-500/10">Delete</button>
              </td>
            </tr>
          ))}}</tbody>
        </table>
      </div>
    </div>
  );
}}
"""

def gen_service(name):
    P=to_pascal(name); p=name.lower()+"s"
    return f"""// Service functions for {P} — add to src/services/api.ts
export const get{P}s = (search?: string) => api.get(`/api/{p}${{search ? `?search=${{search}}` : ''}}`);
export const get{P} = (id: number) => api.get(`/api/{p}/${{id}}`);
export const create{P} = (data: any) => api.post('/api/{p}', data);
export const delete{P} = (id: number) => api.delete(`/api/{p}/${{id}}`);
"""

def gen_types(name, fields):
    P = to_pascal(name)
    flines = "\n".join(f"  {n.split()[0]}: {'number' if 'INTEGER' in t or 'REAL' in t else 'string'};" for n,t in fields)
    return f"export interface {P} {{\n  id: number;\n{flines}\n  user_id: number;\n  created_at: string;\n}}\n"

def scaffold(name, with_admin, dry_run):
    P=to_pascal(name)
    fields = TEMPLATES.get(name.lower(),{}).get("fields",[("title","TEXT"),("description","TEXT"),("status","TEXT DEFAULT 'active'")])
    tmpl = TEMPLATES.get(name.lower())
    if tmpl: print(f"  {C_CYN}ℹ Template:{C_R} {tmpl['desc']}")
    else:    print(f"  {C_CYN}ℹ Using default fields{C_R}")
    print(f"\n{C_B}  Generating: {C_MAG}{P}{C_R}\n")
    n = 0
    n += write_file(SRC/"types"/f"{name.lower()}.ts", gen_types(name, fields), dry_run)
    n += write_file(SRC/"pages"/f"{P}.tsx", gen_page(name), dry_run)
    n += write_file(ROOT/"scripts"/"generated"/f"api_{name.lower()}.ts", gen_api(name), dry_run)
    n += write_file(ROOT/"scripts"/"generated"/f"schema_{name.lower()}.sql", gen_sql(name, fields), dry_run)
    n += write_file(ROOT/"scripts"/"generated"/f"service_{name.lower()}.ts", gen_service(name), dry_run)
    if with_admin:
        n += write_file(SRC/"pages"/"admin"/f"{P}.tsx", gen_admin(name), dry_run)
    return n

def list_templates():
    print(f"\n{C_B}  📦 Feature Templates{C_R}\n")
    print(f"  {'Name':<18} {'Fields':<8} Description")
    print(f"  {'─'*18} {'─'*8} {'─'*40}")
    for k,v in TEMPLATES.items():
        print(f"  {C_CYN}{k:<18}{C_R} {len(v['fields']):<8} {v['desc']}")
    print(f"\n  {C_D}Usage: python scripts/fullstack_scaffolder.py --feature <name>{C_R}\n")

def show_structure():
    print(f"\n{C_B}  📁 Project Structure{C_R}\n")
    for label, d, color in [("Pages",SRC/"pages",C_CYN),("Admin",SRC/"pages"/"admin",C_MAG),("Components",SRC/"components",C_GRN)]:
        if d.exists():
            files = sorted(f.stem for f in d.glob("*.tsx"))
            print(f"  {color}{label} ({len(files)}):{C_R}")
            for f in files: print(f"    ├── {f}")
            print()

def main():
    pa = argparse.ArgumentParser(description="🏗️ Fullstack Scaffolder — Campus Lost & Found")
    pa.add_argument("--feature","-f", help="Feature name to scaffold")
    pa.add_argument("--with-admin", action="store_true", help="Also generate admin page")
    pa.add_argument("--dry-run", action="store_true", help="Preview without creating files")
    pa.add_argument("--list-templates","-l", action="store_true", help="List templates")
    pa.add_argument("--show-structure","-s", action="store_true", help="Show project structure")
    args = pa.parse_args()

    print(f"\n{C_CYN}{C_B}  ┌─────────────────────────────────────────────┐")
    print(f"  │  🏗️  FULLSTACK SCAFFOLDER                    │")
    print(f"  │  Campus Lost & Found — Feature Generator    │")
    print(f"  │  API + Page + Schema + Types + Admin        │")
    print(f"  └─────────────────────────────────────────────┘{C_R}\n")

    if args.list_templates: return list_templates()
    if args.show_structure: return show_structure()
    if not args.feature:
        pa.print_help(); print(f"\n{C_YLW}  ⚠ Specify --feature <name>{C_R}\n"); return

    feat = args.feature.strip().replace(" ","_").replace("-","_")
    if args.dry_run: print(f"  {C_YLW}🔍 DRY RUN{C_R}\n")
    t=datetime.now(); n=scaffold(feat, args.with_admin, args.dry_run); elapsed=(datetime.now()-t).total_seconds()
    mode="previewed" if args.dry_run else "created"
    P=to_pascal(feat)
    print(f"\n{'─'*50}")
    print(f"  {C_GRN}{C_B}✔ Done!{C_R} {n} files {mode} in {elapsed:.2f}s")
    if not args.dry_run and n > 0:
        print(f"\n  {C_B}Next Steps:{C_R}")
        print(f"  1. Copy API routes from scripts/generated/api_{feat}.ts → server.ts")
        print(f"  2. Run SQL from scripts/generated/schema_{feat}.sql")
        print(f"  3. Add route in App.tsx: <Route path=\"/{feat}\" element={{<{P} />}} />")
        print(f"  4. Add services from scripts/generated/service_{feat}.ts\n")

if __name__ == "__main__":
    main()
