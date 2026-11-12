#!/usr/bin/env python3
"""Create editable source for a single-file procedural game; never overwrite work."""
import argparse
import html
from pathlib import Path
import shutil


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory')
    parser.add_argument('--mode', choices=['2d', '3d'], default='2d')
    parser.add_argument('--title', default='Light Courier')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    dest = Path(args.directory).resolve()
    if dest.exists() and any(dest.iterdir()):
        parser.error('Use a new or empty source directory; existing work is not overwritten')
    dest.mkdir(parents=True, exist_ok=True)
    (dest / 'lib').mkdir()
    libraries = ['core.js', 'audio.js'] + (['three.min.js'] if args.mode == '3d' else [])
    for name in libraries:
        shutil.copyfile(root / 'assets/lib' / name, dest / 'lib' / name)
    for name in ['style.css', 'game-core.js', 'host.js']:
        shutil.copyfile(root / 'assets/template' / name, dest / name)
    shutil.copyfile(root / 'assets/template' / (args.mode + '.js'), dest / 'game.js')
    page = (root / 'assets/template/index.html').read_text()
    page = page.replace('@@TITLE@@', html.escape(args.title))
    page = page.replace('@@LIBRARIES@@', '\n'.join('<script src="lib/' + name + '"></script>' for name in libraries))
    (dest / 'index.html').write_text(page)
    shutil.copyfile(root / 'assets/lib/manifest.json', dest / 'library-manifest.json')
    print(f'Created {args.mode} editable starter in {dest}; adapt its example rules to the requested game')

if __name__ == '__main__':
    main()
