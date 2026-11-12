"""Structural helpers. These checks do not execute or prove procedural JS behavior."""
from html.parser import HTMLParser
import re

class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=False)
        self.text = text
        self.offsets = [0]
        for match in re.finditer('\n', text):
            self.offsets.append(match.end())
        self.resources = []
        self.scripts = []
        self.styles = []
        self._script = None
        self._style = None
        self.feed(text)

    def index(self):
        line, column = self.getpos()
        return self.offsets[line - 1] + column

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        start = self.index()
        end = start + len(self.get_starttag_text())
        if tag == 'script':
            self._script = (start, end, attrs)
        elif tag == 'style':
            self._style = end
        elif tag == 'link' and 'stylesheet' in (attrs.get('rel') or '').lower().split():
            self.resources.append((tag, 'href', attrs.get('href', ''), start, end, attrs))
        else:
            mapping = {'img': ['src', 'srcset'], 'source': ['src', 'srcset'], 'audio': ['src'],
                       'video': ['src', 'poster'], 'track': ['src'], 'iframe': ['src'],
                       'embed': ['src'], 'object': ['data'], 'image': ['href', 'xlink:href'],
                       'use': ['href', 'xlink:href'], 'link': ['href']}
            for key in mapping.get(tag, []):
                if attrs.get(key):
                    self.resources.append((tag, key, attrs[key], start, end, attrs))
        if attrs.get('style'):
            self.styles.append(attrs['style'])

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag == 'script' and self._script:
            start, content_start, attrs = self._script
            end = self.text.find('>', self.index()) + 1
            self.scripts.append((start, end, attrs, self.text[content_start:self.index()]))
            self._script = None
        if tag == 'style' and self._style is not None:
            self.styles.append(self.text[self._style:self.index()])
            self._style = None


def inline_reference(value):
    return not value or value.startswith('#') or value.lower().startswith(('data:', 'about:blank'))


def static_errors(text):
    doc = Document(text)
    errors = []
    if doc._script:
        errors.append('Unclosed script element')
    for _, _, attrs, _ in doc.scripts:
        if attrs.get('src'):
            errors.append('External script reference: ' + attrs['src'])
    for tag, key, value, *_ in doc.resources:
        if not inline_reference(value):
            errors.append(f'Unresolved resource {tag}[{key}]: {value}')
    for css in doc.styles:
        css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
        if re.search(r'@import\b', css, re.I):
            errors.append('CSS @import remains')
        for match in re.finditer(r'url\(\s*([\'"]?)(.*?)\1\s*\)', css, re.I | re.S):
            if not inline_reference(match[2].strip()):
                errors.append('CSS resource remains: ' + match[2].strip())
    return doc, errors
