#!/usr/bin/env python3
"""
Code Quality Analyzer — Campus Lost & Found
Scans codebase for anti-patterns, complexity, and best-practice violations.
Usage: python scripts/code_quality_analyzer.py [--analyze] [--fix] [--verbose]
"""
import argparse, os, sys, re, json
from datetime import datetime
from pathlib import Path
from collections import Counter

C_R="\033[0m";C_B="\033[1m";C_D="\033[2m";C_RED="\033[91m";C_GRN="\033[92m"
C_YLW="\033[93m";C_BLU="\033[94m";C_MAG="\033[95m";C_CYN="\033[96m"

def find_root():
    p = Path(__file__).resolve().parent
    for _ in range(5):
        if (p/"package.json").exists(): return p
        p = p.parent
    print(f"{C_RED}✖ No package.json found{C_R}"); sys.exit(1)

ROOT = find_root(); SRC = ROOT/"src"

def print_banner():
    print(f"\n{C_MAG}{C_B}  ┌─────────────────────────────────────────────┐")
    print(f"  │  🔬 CODE QUALITY ANALYZER                   │")
    print(f"  │  Campus Lost & Found — Anti-Pattern Scanner │")
    print(f"  │  Complexity · Security · Best Practices      │")
    print(f"  └─────────────────────────────────────────────┘{C_R}\n")

# ─── Rules ───────────────────────────────────────────────────────────

RULES = [
    {"id":"SEC001","sev":"HIGH","name":"Hardcoded Secret","pattern":r"""(?:password|secret|key|token)\s*[:=]\s*['"][^'"]{4,}['"]""","desc":"Hardcoded credentials found","exts":[".ts",".tsx",".js"]},
    {"id":"SEC002","sev":"MED","name":"No HTTPS Check","pattern":r"http://(?!localhost)","desc":"Non-HTTPS URL detected","exts":[".ts",".tsx",".js"]},
    {"id":"SEC003","sev":"HIGH","name":"SQL Injection Risk","pattern":r"""\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|WHERE)|\bquery\s*\(\s*`[^`]*\$\{""","desc":"Possible SQL injection via template literals","exts":[".ts",".js"]},
    {"id":"PERF01","sev":"MED","name":"Console.log in Production","pattern":r"console\.log\(","desc":"console.log left in code — use a logger","exts":[".ts",".tsx",".js"]},
    {"id":"PERF02","sev":"LOW","name":"Inline Style","pattern":r"style=\{\{","desc":"Inline styles reduce performance — use CSS classes","exts":[".tsx"]},
    {"id":"REACT01","sev":"MED","name":"Missing Error Boundary","pattern":r"catch\s*\([^)]*\)\s*\{[^}]*\}","desc":"Error caught but not shown to user","exts":[".tsx"]},
    {"id":"REACT02","sev":"LOW","name":"Index as Key","pattern":r"key=\{[^}]*(?:index|idx|i)\}","desc":"Using array index as React key — use unique IDs","exts":[".tsx"]},
    {"id":"REACT03","sev":"MED","name":"useEffect Missing Deps","pattern":r"useEffect\(\s*\(\)\s*=>\s*\{[^}]+\}\s*,\s*\[\s*\]\s*\)","desc":"Empty dependency array may cause stale closures","exts":[".tsx"]},
    {"id":"TS001","sev":"LOW","name":"Excessive 'any'","pattern":r":\s*any(?:\[\])?[;,\)\s]","desc":"Using 'any' defeats TypeScript benefits","exts":[".ts",".tsx"]},
    {"id":"TS002","sev":"LOW","name":"Type Assertion","pattern":r"as\s+any","desc":"'as any' bypasses type checking","exts":[".ts",".tsx"]},
    {"id":"MAINT01","sev":"LOW","name":"TODO/FIXME","pattern":r"(?://|/\*)\s*(?:TODO|FIXME|HACK|XXX)","desc":"Unresolved TODO/FIXME comment found","exts":[".ts",".tsx",".js"]},
    {"id":"MAINT02","sev":"MED","name":"Large File","pattern":None,"desc":"File exceeds 300 lines — consider splitting","exts":[".ts",".tsx"]},
]

# ─── Scanner ─────────────────────────────────────────────────────────

def scan_file(filepath, verbose=False):
    """Scan a single file against all rules"""
    findings = []
    try:
        content = filepath.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return findings
    
    lines = content.split("\n")
    ext = filepath.suffix
    rel = str(filepath.relative_to(ROOT))
    
    for rule in RULES:
        if ext not in rule["exts"]:
            continue
        
        # Special: large file check
        if rule["id"] == "MAINT02":
            if len(lines) > 300:
                findings.append({
                    "rule": rule["id"], "sev": rule["sev"], "name": rule["name"],
                    "file": rel, "line": None, "desc": f"{rule['desc']} ({len(lines)} lines)",
                })
            continue
        
        if rule["pattern"] is None:
            continue
        
        for i, line in enumerate(lines):
            # Skip comments for some rules
            stripped = line.strip()
            if stripped.startswith("//") and rule["id"] not in ["MAINT01"]:
                continue
            
            try:
                if re.search(rule["pattern"], line, re.IGNORECASE):
                    findings.append({
                        "rule": rule["id"], "sev": rule["sev"], "name": rule["name"],
                        "file": rel, "line": i+1,
                        "desc": rule["desc"],
                        "snippet": stripped[:100] if verbose else None,
                    })
            except re.error:
                pass
    
    return findings

def compute_complexity(filepath):
    """Simple cyclomatic complexity estimation"""
    try:
        content = filepath.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return 0
    
    # Count decision points
    decision_keywords = [r'\bif\b', r'\belse\b', r'\bfor\b', r'\bwhile\b', r'\bswitch\b',
                         r'\bcase\b', r'\bcatch\b', r'\b\?\?', r'\?\.',  r'\btry\b', r'&&', r'\|\|']
    complexity = 1  # base
    for kw in decision_keywords:
        complexity += len(re.findall(kw, content))
    return complexity

def analyze_file_sizes(root):
    """Get file size distribution"""
    sizes = []
    for ext in [".ts", ".tsx", ".js", ".jsx"]:
        for f in (root/"src").rglob(f"*{ext}"):
            lines = len(f.read_text(encoding="utf-8", errors="ignore").split("\n"))
            sizes.append({"file": str(f.relative_to(root)), "lines": lines})
    return sorted(sizes, key=lambda x: -x["lines"])

def analyze_imports(root):
    """Check for unused or circular import patterns"""
    import_counts = Counter()
    for f in (root/"src").rglob("*.tsx"):
        content = f.read_text(encoding="utf-8", errors="ignore")
        for m in re.finditer(r"from\s+['\"]([^'\"]+)['\"]", content):
            import_counts[m.group(1)] += 1
    for f in (root/"src").rglob("*.ts"):
        content = f.read_text(encoding="utf-8", errors="ignore")
        for m in re.finditer(r"from\s+['\"]([^'\"]+)['\"]", content):
            import_counts[m.group(1)] += 1
    return import_counts.most_common(15)

# ─── Display ─────────────────────────────────────────────────────────

def display_results(findings, file_sizes, imports, verbose):
    # Severity summary
    sev_counts = Counter(f["sev"] for f in findings)
    total = len(findings)
    
    high = sev_counts.get("HIGH",0)
    med = sev_counts.get("MED",0)
    low = sev_counts.get("LOW",0)
    
    print(f"  {C_B}Found {total} issues{C_R}")
    print(f"    {C_RED}HIGH: {high}{C_R}  |  {C_YLW}MED: {med}{C_R}  |  {C_BLU}LOW: {low}{C_R}\n")
    
    # Group by rule
    by_rule = {}
    for f in findings:
        by_rule.setdefault(f["rule"], []).append(f)
    
    print(f"  {C_B}Issues by Category{C_R}\n")
    for rule_id in sorted(by_rule.keys()):
        items = by_rule[rule_id]
        sev = items[0]["sev"]
        name = items[0]["name"]
        sev_color = {
            "HIGH": C_RED, "MED": C_YLW, "LOW": C_BLU 
        }.get(sev, C_D)
        
        print(f"  {sev_color}[{sev:>4}]{C_R} {C_B}{rule_id}{C_R}: {name}  ({len(items)} occurrences)")
        print(f"    {C_D}{items[0]['desc']}{C_R}")
        
        if verbose:
            shown = items[:5]
            for item in shown:
                loc = f":{item['line']}" if item.get("line") else ""
                print(f"      → {item['file']}{loc}")
                if item.get("snippet"):
                    print(f"        {C_D}{item['snippet']}{C_R}")
            if len(items) > 5:
                print(f"      {C_D}... and {len(items)-5} more{C_R}")
        print()
    
    # File sizes
    print(f"  {C_CYN}{C_B}📊 Largest Files{C_R}\n")
    for f in file_sizes[:8]:
        bar_len = min(f["lines"]//20, 30)
        bar = "█"*bar_len
        color = C_RED if f["lines"]>300 else (C_YLW if f["lines"]>200 else C_GRN)
        print(f"    {color}{f['lines']:>5}{C_R} lines  {C_BLU}{bar}{C_R}  {f['file']}")
    
    # Import analysis
    print(f"\n  {C_MAG}{C_B}📦 Most Used Imports{C_R}\n")
    for imp, count in imports[:10]:
        print(f"    {count:>3}x  {imp}")
    
    # Score
    score = max(0, 100 - (high*15) - (med*5) - (low*1))
    if score >= 80: color, grade = C_GRN, "A"
    elif score >= 60: color, grade = C_YLW, "B"
    elif score >= 40: color, grade = C_YLW, "C"
    else: color, grade = C_RED, "D"
    
    print(f"\n{'─'*50}")
    print(f"  {C_B}Code Quality Score: {color}{score}/100 ({grade}){C_R}")
    
    if high > 0:
        print(f"\n  {C_RED}{C_B}⚠ {high} HIGH severity issues require immediate attention!{C_R}")
    print()

# ─── Main ────────────────────────────────────────────────────────────

def main():
    pa = argparse.ArgumentParser(description="🔬 Code Quality Analyzer")
    pa.add_argument("--analyze", "-a", action="store_true", default=True, help="Run full analysis")
    pa.add_argument("--verbose", "-v", action="store_true", help="Show detailed findings")
    pa.add_argument("--json", action="store_true", help="Output as JSON")
    pa.add_argument("--file", "-f", type=str, help="Analyze a single file")
    args = pa.parse_args()
    
    print_banner()
    print(f"  {C_D}Scanning: {ROOT/'src'}{C_R}\n")
    
    # Collect files
    files_to_scan = []
    if args.file:
        fp = Path(args.file).resolve()
        if fp.exists(): files_to_scan = [fp]
        else: print(f"{C_RED}✖ File not found: {args.file}{C_R}"); sys.exit(1)
    else:
        for ext in [".ts",".tsx",".js"]:
            files_to_scan.extend((ROOT/"src").rglob(f"*{ext}"))
        # Also scan server.ts
        if (ROOT/"server.ts").exists():
            files_to_scan.append(ROOT/"server.ts")
    
    # Run scan
    all_findings = []
    for fp in files_to_scan:
        all_findings.extend(scan_file(fp, args.verbose))
    
    file_sizes = analyze_file_sizes(ROOT)
    imports = analyze_imports(ROOT)
    
    if args.json:
        print(json.dumps({"findings":all_findings,"file_sizes":file_sizes[:10],
            "imports":imports}, indent=2, default=str))
    else:
        display_results(all_findings, file_sizes, imports, args.verbose)

if __name__ == "__main__":
    main()
