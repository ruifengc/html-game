#!/usr/bin/env python3
"""Inline local classic scripts/styles; reject unresolved loaded resources."""
import argparse
import html
from pathlib import Path
import re
from singlefile import Document, static_errors


def bundle(entry):
    entry = Path(entry).resolve()
    root = entry.parent
    text = entry.read_text()
    doc = Document(text)
    edits = []

    def local_file(value):
        if not value or re.match(r'(?i)(?:[a-z][a-z0-9+.-]*:|//)', value) or '?' in value or '#' in value:
            raise ValueError('Only plain local paths can be inlined: ' + str(value))
        resolved = (root / value).resolve()
        if not resolved.is_relative_to(root):
            raise ValueError('Resource escapes the entry directory: ' + value)
        if not resolved.is_file():
            raise ValueError('Missing resource: ' + value)
        return resolved

    for start, end, attrs, content in doc.scripts:
        if attrs.get('type', '').lower() == 'module':
            raise ValueError('Prebundle ES modules before inlining this artifact')
        if not attrs.get('src'):
            continue
        if 'async' in attrs or 'defer' in attrs:
            raise ValueError('Use ordered classic scripts; async/defer execution cannot be preserved by simple inlining')
        script = local_file(attrs['src']).read_text()
        script = re.sub(r'</script', r'<\\/script', script, flags=re.I)
        kept = ''.join(' ' + key + ('="' + html.escape(value, quote=True) + '"' if value is not None else '')
                       for key, value in attrs.items() if key not in ('src', 'integrity', 'crossorigin'))
        edits.append((start, end, '<script' + kept + '>\n' + script + '\n</script>'))
    for tag, key, value, start, end, attrs in doc.resources:
        if tag == 'link' and 'stylesheet' in attrs.get('rel', '').lower().split():
            css = local_file(value).read_text()
            css = re.sub(r'</style', r'<\\/style', css, flags=re.I)
            media = ' media="' + html.escape(attrs['media'], quote=True) + '"' if attrs.get('media') else ''
            edits.append((start, end, '<style' + media + '>\n' + css + '\n</style>'))
    for start, end, replacement in sorted(edits, reverse=True):
        text = text[:start] + replacement + text[end:]
    _, errors = static_errors(text)
    if errors:
        raise ValueError('\n'.join(errors))
    return text


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('entry')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    text = bundle(args.entry)
    output = Path(args.output)
    if output.resolve() == Path(args.entry).resolve():
        parser.error('Output must differ from the editable entry')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(text)
    print(f'Built {output}: {len(text.encode())} bytes; no unresolved structural resources')

if __name__ == '__main__':
    main()
