#!/usr/bin/env python3
"""Run portable repository checks; browser smoke checks remain opt-in."""
from pathlib import Path
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
node = shutil.which('node')
if not node:
    raise SystemExit('Node.js 18+ is required for JavaScript checks')
subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-v'], cwd=root, check=True)
subprocess.run([node, 'tests/game-core.test.cjs'], cwd=root, check=True)
files = sorted(root.joinpath('assets').rglob('*.js')) + sorted(root.joinpath('references/implementation').glob('*.js'))
for path in files:
    subprocess.run([node, '--check', str(path)], cwd=root, check=True, capture_output=True)
print(f'Project checks passed; {len(files)} JavaScript files parsed.')
