import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from bundle_game import bundle
from singlefile import static_errors
from install_skill import install


class PackagingTests(unittest.TestCase):
    def test_order_and_script_terminator(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp)
            (p / 'a.js').write_text('window.a="</script>";')
            (p / 'b.js').write_text('window.b=window.a;')
            (p / 'style.css').write_text('body { color: red; }')
            (p / 'index.html').write_text('<link rel="stylesheet" href="style.css"><script src="a.js"></script><script src="b.js"></script>')
            result = bundle(p / 'index.html')
            doc, errors = static_errors(result)
            self.assertEqual(errors, [])
            self.assertEqual(len(doc.scripts), 2)
            self.assertIn('<\\/script>', result)
            self.assertLess(result.index('window.a='), result.index('window.b='))

    def test_external_scripts_and_css_resources_are_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp)
            (p / 'index.html').write_text('<script src="https://example.test/x.js"></script>')
            with self.assertRaises(ValueError):
                bundle(p / 'index.html')
            (p / 'style.css').write_text('body { background:url(./image.png); }')
            (p / 'index.html').write_text('<link rel="stylesheet" href="style.css">')
            with self.assertRaises(ValueError):
                bundle(p / 'index.html')

    def test_parent_and_symlink_escapes_are_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp)
            (p / 'private.js').write_text('private')
            (p / 'app').mkdir()
            (p / 'app/link.js').symlink_to(p / 'private.js')
            for name in ('../private.js', 'link.js'):
                with self.subTest(name=name):
                    (p / 'app/index.html').write_text('<script src="' + name + '"></script>')
                    with self.assertRaises(ValueError):
                        bundle(p / 'app/index.html')

    def test_dormant_loader_is_not_a_loaded_resource(self):
        _, errors = static_errors('<script>function load(){return fetch("https://example.test")}</script>')
        self.assertEqual(errors, [])

    def test_module_graph_requires_prebundling(self):
        with tempfile.TemporaryDirectory() as tmp:
            entry = Path(tmp) / 'index.html'
            entry.write_text('<script type="module">import "./other.js";</script>')
            with self.assertRaises(ValueError):
                bundle(entry)


class ProjectTests(unittest.TestCase):
    def test_library_checksums_and_dependency_notice(self):
        manifest = json.loads((ROOT / 'assets/lib/manifest.json').read_text())
        for name, checksum in manifest['files'].items():
            self.assertEqual(hashlib.sha256((ROOT / 'assets/lib' / name).read_bytes()).hexdigest(), checksum)
        self.assertIn('Permission is hereby granted', (ROOT / 'assets/lib/three.min.js').read_text()[:2500])
        self.assertIn('Permission is hereby granted', (ROOT / 'third-party/three-LICENSE.txt').read_text())

    def test_instruction_language_and_local_document_links(self):
        documents = [ROOT / 'SKILL.md', ROOT / 'README.md', *ROOT.joinpath('references').glob('*.md')]
        for document in documents:
            text = document.read_text()
            self.assertIsNone(re.search('[\u4e00-\u9fff]', text), document)
        for document in [*documents, ROOT / 'README.zh-CN.md']:
            text = document.read_text()
            for target in re.findall(r'\]\(([^)]+)\)', text):
                if '://' not in target:
                    self.assertTrue((document.parent / target.split('#')[0]).is_file(), (document, target))

    def test_both_starters_build_in_temporary_directories(self):
        with tempfile.TemporaryDirectory() as tmp:
            for mode in ('2d', '3d'):
                dest = Path(tmp) / mode
                subprocess.run([sys.executable, str(ROOT / 'scripts/new_game.py'), str(dest), '--mode', mode, '--title', 'A < B & "Test"'], check=True, capture_output=True)
                self.assertIn('A &lt; B &amp; &quot;Test&quot;', (dest / 'index.html').read_text())
                artifact = bundle(dest / 'index.html')
                _, errors = static_errors(artifact)
                self.assertEqual(errors, [], mode)
                self.assertNotIn('<script src=', artifact)
                self.assertNotIn('@@LIBRARIES@@', artifact)
                self.assertTrue((dest / 'library-manifest.json').is_file())
                if mode == '3d':
                    self.assertIn('Permission is hereby granted', artifact)
                result = subprocess.run([sys.executable, str(ROOT / 'scripts/new_game.py'), str(dest)], capture_output=True)
                self.assertNotEqual(result.returncode, 0)

    def test_installer_updates_only_with_replace_and_is_self_contained(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'installed'
            install(ROOT, dest)
            self.assertTrue((dest / 'SKILL.md').is_file())
            self.assertFalse((dest / '.git').exists())
            self.assertFalse((dest / 'tests').exists())
            with self.assertRaises(FileExistsError):
                install(ROOT, dest)
            (dest / 'obsolete.txt').write_text('old payload')
            install(ROOT, dest, replace=True)
            self.assertFalse((dest / 'obsolete.txt').exists())
            output = Path(tmp) / 'generated'
            subprocess.run([sys.executable, str(dest / 'scripts/new_game.py'), str(output)], check=True, capture_output=True)
            self.assertEqual(static_errors(bundle(output / 'index.html'))[1], [])

    def test_installer_rejects_self_and_symlink_destinations(self):
        with self.assertRaises(ValueError):
            install(ROOT, ROOT, replace=True)
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'link'
            p.symlink_to(ROOT, target_is_directory=True)
            with self.assertRaises(ValueError):
                install(ROOT, p, replace=True)

if __name__ == '__main__':
    unittest.main()
