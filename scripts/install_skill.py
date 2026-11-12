#!/usr/bin/env python3
"""Install the self-contained skill payload without copying repository metadata."""
import argparse
import os
from pathlib import Path
import shutil
import tempfile

PAYLOAD = ('SKILL.md', 'agents', 'assets', 'references', 'scripts', 'third-party', 'THIRD_PARTY_NOTICES.md')


def install(source, destination, replace=False):
    source = Path(source).resolve()
    destination = Path(destination).expanduser().absolute()
    if destination.is_symlink():
        raise ValueError('Destination is a symlink; choose an explicit skill directory')
    if source == destination.resolve():
        raise ValueError('Source and destination must differ')
    if destination.exists() and not replace:
        raise FileExistsError('Skill already exists; use --replace to update it')
    if destination.exists() and not destination.is_dir():
        raise ValueError('Destination must be a directory')
    for required in ('SKILL.md', 'assets', 'scripts', 'references'):
        if not (source / required).exists():
            raise ValueError('Missing skill payload: ' + required)
    destination.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix='.html-game-', dir=destination.parent))
    backup = staging.with_name(staging.name + '-backup')
    try:
        for name in PAYLOAD:
            item = source / name
            if not item.exists():
                continue
            if item.is_dir():
                shutil.copytree(item, staging / name, ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
            else:
                shutil.copyfile(item, staging / name)
        if destination.exists():
            destination.rename(backup)
        try:
            staging.rename(destination)
        except Exception:
            if backup.exists():
                backup.rename(destination)
            raise
        if backup.exists():
            shutil.rmtree(backup)
    finally:
        if staging.exists():
            shutil.rmtree(staging)
    return destination


def main():
    home = Path(os.environ.get('CODEX_HOME') or (Path.home() / '.codex'))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--destination', type=Path, default=home / 'skills' / 'html-game')
    parser.add_argument('--replace', action='store_true')
    args = parser.parse_args()
    try:
        destination = install(Path(__file__).resolve().parents[1], args.destination, args.replace)
    except (ValueError, FileExistsError) as error:
        parser.error(str(error))
    print('Installed skill:', destination)

if __name__ == '__main__':
    main()
