# Single-file artifact contract

The final HTML should open with `file://`, contain its CSS/scripts and procedural generation code, and need no runtime network. A linked source project is useful for editing but is not the final artifact.

## Bundler scope

`bundle_game.py` accepts ordinary local `<script src="…"></script>` and stylesheet links under the entry directory. It preserves script order and embeds code/style text. Escaping `</script` matters even inside JS strings/comments because HTML parsing terminates the element first. It rejects external links/modules/resource files it cannot turn into a genuinely self-contained document. It never follows parent-directory or symlink escapes to pick up unrelated files.

The intended input uses classic scripts near the end of body and local CSS. For ES modules, package the module graph first and then inline the generated classic bundle. Do not remove imports by string replacement. Dynamic `fetch`, worker imports, CSS imports/URLs and loader calls need separate review; the bundler is not a general JS dependency analyzer.

## Static verification

The verifier inspects actual HTML resource attributes and CSS loads. It does not reject every occurrence of `fetch`/URL in a bundled engine: dormant loading classes can exist in a self-contained game. It reports what static checks establish and leaves runtime verification separate.

Inline SVG/Canvas/WebGL and code-generated PCM need no resource fetch. A base64 texture may be self-contained, but does not by itself prove that the artwork is procedural. Prefer runtime generation rules when that is what the user requested.

## Runtime verification

Use `--screenshot /path/to/preview.png` with browser mode when visual inspection is useful. The optional browser mode uses file navigation, blocks HTTP(S)/WebSocket resource requests and records page/console errors. It can exercise starter hooks (boot, start, movement, terminal-state transitions, restart), but a hook test cannot replace a manual/automated test of the intended mechanic and its inputs.

Use the actual output file, not only the split source served on localhost. Resize after boot and test relevant touch/keyboard/mouse behavior. Audio must start after user activation. If 3D is requested, confirm that the expected WebGL path runs; do not call a fallback screenshot an equivalent result.

When browser tools or a GPU path are unavailable, report precisely which checks passed. Single-file syntax/static checks do not prove playability, art quality, performance or sound quality.
