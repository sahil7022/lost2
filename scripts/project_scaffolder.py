#!/usr/bin/env python3
"""
Project Scaffolder — Campus Lost & Found
Deep analysis of project structure, dependencies, and health.
Usage: python scripts/project_scaffolder.py <target-path> [--verbose] [--fix]
"""
import argparse, os, sys, json, re
from datetime import datetime
from pathlib import Path
from collections import Counter

C_R="\033[0m";C_B="\033[1m";C_D="\033[2m";C_RED="\033[91m";C_GRN="\033[92m"
C_YLW="\033[93m";C_BLU="\033[94m";C_MAG="\033[95m";C_CYN="\033[96m"

def find_root(target=None):
    p = Path(target).resolve() if target else Path(__file__).resolve().parent
    for _ in range(5):
        if (p/"package.json").exists(): return p
        p = p.parent
    print(f"{C_RED}✖ No package.json found{C_R}"); sys.exit(1)

def print_banner():
    print(f"\n{C_CYN}{C_B}  ┌─────────────────────────────────────────────┐")
    print(f"  │  🔍 PROJECT SCAFFOLDER                      │")
    print(f"  │  Campus Lost & Found — Project Analyzer     │")
    print(f"  │  Structure · Dependencies · Health           │")
    print(f"  └─────────────────────────────────────────────┘{C_R}\n")

# ─── Analyzers ───────────────────────────────────────────────────────

def analyze_structure(root):
    """Analyze project directory structure"""
    results = {"pages":[],"components":[],"services":[],"admin_pages":[],"context":[],"lib":[]}
    src = root / "src"
    if not src.exists(): return results
    
    for name, subdir in [("pages","pages"),("components","components"),("services","services"),
                          ("context","context"),("lib","lib")]:
        d = src / subdir
        if d.exists():
            results[name] = sorted([f.name for f in d.glob("*") if f.is_file()])
    
    admin = src / "pages" / "admin"
    if admin.exists():
        results["admin_pages"] = sorted([f.name for f in admin.glob("*.tsx")])
    
    return results

def analyze_dependencies(root):
    """Check package.json for issues"""
    pkg_path = root / "package.json"
    if not pkg_path.exists(): return {"error": "No package.json"}
    
    pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
    deps = pkg.get("dependencies", {})
    dev_deps = pkg.get("devDependencies", {})
    
    issues = []
    recommendations = []
    
    # Check for duplicate deps in both
    overlap = set(deps.keys()) & set(dev_deps.keys())
    if overlap:
        for o in overlap:
            issues.append(f"'{o}' is in both dependencies and devDependencies")
    
    # Check for missing common security deps
    if "helmet" not in deps:
        recommendations.append("Consider adding 'helmet' for Express security headers")
    if "express-rate-limit" not in deps:
        recommendations.append("Consider adding 'express-rate-limit' for API rate limiting")
    if "compression" not in deps:
        recommendations.append("Consider adding 'compression' for response compression")
    
    # Check for vite in both
    if "vite" in deps and "vite" in dev_deps:
        issues.append("'vite' is duplicated — keep only in devDependencies")
    
    # Check scripts
    scripts = pkg.get("scripts", {})
    missing_scripts = []
    for s in ["dev","build","lint"]:
        if s not in scripts:
            missing_scripts.append(s)
    if missing_scripts:
        recommendations.append(f"Missing npm scripts: {', '.join(missing_scripts)}")
    if "test" not in scripts:
        recommendations.append("No 'test' script defined — consider adding testing")
    
    return {
        "name": pkg.get("name","unknown"),
        "version": pkg.get("version","0.0.0"),
        "deps_count": len(deps),
        "dev_deps_count": len(dev_deps),
        "scripts": list(scripts.keys()),
        "issues": issues,
        "recommendations": recommendations,
        "deps": deps,
        "dev_deps": dev_deps,
    }

def analyze_env(root):
    """Check environment configuration"""
    env_example = root / ".env.example"
    env_file = root / ".env"
    gitignore = root / ".gitignore"
    
    issues = []
    
    if not env_example.exists():
        issues.append("No .env.example file — team members won't know required env vars")
    
    if env_file.exists():
        env_content = env_file.read_text(encoding="utf-8")
        if "hackathon-secret" in env_content or "your-secret" in env_content:
            issues.append("⚠️  .env contains default/placeholder secret keys — change for production!")
    
    if gitignore.exists():
        gi_content = gitignore.read_text(encoding="utf-8")
        if ".env" not in gi_content:
            issues.append("CRITICAL: .env is NOT in .gitignore — secrets may be committed!")
    else:
        issues.append("No .gitignore file found")
    
    return issues

def analyze_server(root):
    """Analyze server.ts for patterns and issues"""
    server = root / "server.ts"
    if not server.exists(): return {"exists": False}
    
    content = server.read_text(encoding="utf-8")
    lines = content.split("\n")
    
    # Count API routes
    routes = []
    for i, line in enumerate(lines):
        match = re.search(r'app\.(get|post|put|delete|patch)\s*\(\s*["\']([^"\']+)', line)
        if match:
            routes.append({"method": match.group(1).upper(), "path": match.group(2), "line": i+1})
    
    # Check patterns
    issues = []
    has_cors = "cors()" in content
    has_auth = "authenticateToken" in content
    has_websocket = "WebSocket" in content or "ws" in content
    has_file_upload = "multer" in content
    has_rate_limit = "rateLimit" in content or "rate-limit" in content
    has_input_validation = "joi" in content.lower() or "zod" in content.lower() or "express-validator" in content.lower()
    
    if not has_rate_limit:
        issues.append("No rate limiting detected — vulnerable to abuse")
    if not has_input_validation:
        issues.append("No input validation library — validate request bodies")
    if "console.error" not in content and "console.log" not in content:
        issues.append("No logging detected — add structured logging")
    
    return {
        "exists": True,
        "total_lines": len(lines),
        "route_count": len(routes),
        "routes": routes,
        "features": {
            "cors": has_cors,
            "auth": has_auth,
            "websocket": has_websocket,
            "file_upload": has_file_upload,
            "rate_limiting": has_rate_limit,
            "input_validation": has_input_validation,
        },
        "issues": issues,
    }

def analyze_types(root):
    """Check TypeScript types coverage"""
    src = root / "src"
    if not src.exists(): return {}
    
    any_count = 0; total_files = 0; files_with_any = []
    for f in src.rglob("*.tsx"):
        total_files += 1
        content = f.read_text(encoding="utf-8", errors="ignore")
        count = content.count(": any") + content.count("<any>") + content.count("as any")
        if count > 0:
            any_count += count
            files_with_any.append({"file": str(f.relative_to(root)), "count": count})
    for f in src.rglob("*.ts"):
        total_files += 1
        content = f.read_text(encoding="utf-8", errors="ignore")
        count = content.count(": any") + content.count("<any>") + content.count("as any")
        if count > 0:
            any_count += count
            files_with_any.append({"file": str(f.relative_to(root)), "count": count})
    
    return {
        "total_files": total_files,
        "any_count": any_count,
        "files_with_any": sorted(files_with_any, key=lambda x: -x["count"])[:10],
    }

def compute_health_score(dep_info, env_issues, server_info, type_info):
    """Compute overall project health 0-100"""
    score = 100
    # Deductions
    score -= len(dep_info.get("issues",[])) * 5
    score -= len(dep_info.get("recommendations",[])) * 2
    score -= len(env_issues) * 8
    if server_info.get("exists"):
        score -= len(server_info.get("issues",[])) * 5
        if not server_info["features"].get("rate_limiting"): score -= 5
        if not server_info["features"].get("input_validation"): score -= 5
    any_count = type_info.get("any_count", 0)
    if any_count > 20: score -= 10
    elif any_count > 10: score -= 5
    elif any_count > 5: score -= 3
    return max(0, min(100, score))

# ─── Display ─────────────────────────────────────────────────────────

def display_results(structure, dep_info, env_issues, server_info, type_info, verbose):
    score = compute_health_score(dep_info, env_issues, server_info, type_info)
    
    # Health Score
    if score >= 80: color, grade = C_GRN, "A"
    elif score >= 60: color, grade = C_YLW, "B"
    elif score >= 40: color, grade = C_YLW, "C"
    else: color, grade = C_RED, "D"
    
    print(f"  {C_B}Project Health Score: {color}{score}/100 ({grade}){C_R}\n")
    
    # Structure
    print(f"  {C_CYN}{C_B}📁 Structure{C_R}")
    tbl = [("Pages", len(structure["pages"])), ("Components", len(structure["components"])),
           ("Services", len(structure["services"])), ("Admin Pages", len(structure["admin_pages"])),
           ("Context", len(structure["context"])), ("Lib/Utils", len(structure["lib"]))]
    for name, count in tbl:
        bar = "█" * min(count, 20)
        print(f"    {name:<15} {C_CYN}{count:>3}{C_R}  {C_BLU}{bar}{C_R}")
    
    if verbose:
        for cat in ["pages","components","admin_pages"]:
            if structure[cat]:
                print(f"\n    {C_D}{cat}:{C_R}")
                for f in structure[cat]:
                    print(f"      ├── {f}")
    
    # Dependencies
    print(f"\n  {C_MAG}{C_B}📦 Dependencies{C_R}")
    print(f"    Production:  {dep_info['deps_count']}")
    print(f"    Development: {dep_info['dev_deps_count']}")
    print(f"    Scripts:     {', '.join(dep_info['scripts'])}")
    
    if dep_info["issues"]:
        print(f"\n    {C_RED}Issues:{C_R}")
        for i in dep_info["issues"]:
            print(f"      ✖ {i}")
    if dep_info["recommendations"]:
        print(f"\n    {C_YLW}Recommendations:{C_R}")
        for r in dep_info["recommendations"]:
            print(f"      → {r}")
    
    # Environment
    if env_issues:
        print(f"\n  {C_YLW}{C_B}🔐 Environment Issues{C_R}")
        for i in env_issues:
            print(f"    ⚠ {i}")
    else:
        print(f"\n  {C_GRN}{C_B}🔐 Environment{C_R}  ✔ All good")
    
    # Server
    if server_info.get("exists"):
        print(f"\n  {C_BLU}{C_B}⚡ Server Analysis{C_R}")
        print(f"    Lines:    {server_info['total_lines']}")
        print(f"    Routes:   {server_info['route_count']}")
        
        fts = server_info["features"]
        for feat, enabled in fts.items():
            icon = f"{C_GRN}✔{C_R}" if enabled else f"{C_RED}✖{C_R}"
            print(f"    {icon} {feat.replace('_',' ').title()}")
        
        if verbose and server_info["routes"]:
            print(f"\n    {C_D}Routes:{C_R}")
            for r in server_info["routes"]:
                color = {"GET":C_GRN,"POST":C_BLU,"PUT":C_YLW,"DELETE":C_RED}.get(r["method"],C_D)
                print(f"      {color}{r['method']:<7}{C_R} {r['path']}")
        
        if server_info["issues"]:
            print(f"\n    {C_YLW}Issues:{C_R}")
            for i in server_info["issues"]:
                print(f"      → {i}")
    
    # TypeScript
    print(f"\n  {C_CYN}{C_B}🔷 TypeScript Quality{C_R}")
    print(f"    Files scanned:  {type_info.get('total_files', 0)}")
    any_count = type_info.get("any_count", 0)
    any_color = C_GRN if any_count < 5 else (C_YLW if any_count < 15 else C_RED)
    print(f"    'any' usages:   {any_color}{any_count}{C_R}")
    if verbose and type_info.get("files_with_any"):
        print(f"\n    {C_D}Top files with 'any':{C_R}")
        for f in type_info["files_with_any"][:5]:
            print(f"      {f['count']:>3}x  {f['file']}")
    
    print(f"\n{'─'*50}")
    print(f"  {color}{C_B}Overall: {score}/100{C_R}  |  Grade: {color}{grade}{C_R}")
    print()

# ─── Main ────────────────────────────────────────────────────────────

def main():
    pa = argparse.ArgumentParser(description="🔍 Project Scaffolder — Analyze project health")
    pa.add_argument("target", nargs="?", default=".", help="Project path to analyze")
    pa.add_argument("--verbose", "-v", action="store_true", help="Show detailed output")
    pa.add_argument("--json", action="store_true", help="Output as JSON")
    args = pa.parse_args()
    
    print_banner()
    root = find_root(args.target)
    print(f"  {C_D}Analyzing: {root}{C_R}\n")
    
    structure = analyze_structure(root)
    dep_info = analyze_dependencies(root)
    env_issues = analyze_env(root)
    server_info = analyze_server(root)
    type_info = analyze_types(root)
    
    if args.json:
        print(json.dumps({"structure":structure,"dependencies":dep_info,
            "env_issues":env_issues,"server":server_info,"types":type_info,
            "score":compute_health_score(dep_info,env_issues,server_info,type_info)}, indent=2))
    else:
        display_results(structure, dep_info, env_issues, server_info, type_info, args.verbose)

if __name__ == "__main__":
    main()
