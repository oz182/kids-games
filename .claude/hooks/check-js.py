#!/usr/bin/env python3
"""PostToolUse hook: syntax-check any edited .js file.

Uses `node --check` when node is installed, otherwise falls back to macOS's
bundled JavaScriptCore shell (compile via `new Function` — parses without
executing). Exit code 2 reports the error back to Claude so it fixes it
immediately.
"""
import json
import shutil
import subprocess
import sys

JSC = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc"

data = json.load(sys.stdin)
path = (data.get("tool_input") or {}).get("file_path", "")
if not path.endswith(".js"):
    sys.exit(0)

if shutil.which("node"):
    cmd = ["node", "--check", path]
else:
    check = (
        f'var src = readFile({json.dumps(path)});'
        'try { new Function(src); } catch (e) { print("SyntaxError: " + e.message); quit(1); }'
    )
    cmd = [JSC, "-e", check]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode != 0:
    sys.stderr.write(f"{path}: {result.stdout}{result.stderr}")
    sys.exit(2)
