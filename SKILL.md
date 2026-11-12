---
name: html-game
description: Build playable browser games as a single offline HTML file, with graphics, geometry, textures and sound generated in code. Use for single-file games, procedural game scenes, and self-contained interactive toys; choose the rendering approach for the requested experience.
---

# HTML Game

Build the requested playable game or interactive toy as one HTML file that opens locally without a server. Choose mechanics, theme and visual direction for the brief; a starter is not the finished game. Write player-facing text in the user's requested language.

## Develop the game

Choose Canvas/SVG/DOM for suitable 2D experiences or WebGL when depth and lighting serve the game. Define the central action, feedback, progression and restart before adding scenery. Preserve the ambition of the request; do not replace a requested 3D game with 2D for convenience.

The optional 2D and 3D starters implement a small collection-and-avoidance game. They demonstrate the input loop and packaging, not a visual quality ceiling. Replace or adapt their rules and presentation to the brief, or build from scratch.

```bash
python3 <skill>/scripts/new_game.py <working-directory> --mode 2d --title 'Game Title'
# Use --mode 3d for the Three.js starter.
```

Work in a new or empty directory. Read [procedural-design.md](references/procedural-design.md) for techniques and [3d-runtime.md](references/3d-runtime.md) for the 3D starter's rendering boundary. Generate and cache repeated textures, geometry and sounds; pool transient effects where useful. Start or resume audio on a user gesture and offer mute. Coordinate presentation with gameplay state, and reset input, timers and effects on restart.

## Package and verify

Keep the final artifact self-contained: no runtime CDN imports, external fonts, images, audio or local-file fetches. Use classic inline scripts or prebundle modules. Preserve the license notice when embedding third-party code.

```bash
python3 <skill>/scripts/bundle_game.py <working-directory>/index.html --output <working-directory>/game.html
python3 <skill>/scripts/verify_game.py <working-directory>/game.html
```

The bundler supports local classic scripts and styles under the entry directory; see [single-file.md](references/single-file.md) for limitations. Structural checks do not prove offline behavior or gameplay correctness. When browser control is available, test the actual artifact with networking blocked: boot, visible rendering, central mechanics, restart, resize and requested input modes. An optional starter smoke runner is available:

```bash
<python-with-patchright-or-playwright> <skill>/scripts/verify_game.py <game.html> --browser
```

The runner exercises `window.__game` diagnostics in the included starter; adapt gameplay tests to custom rules. Deliver the HTML, controls and verified behavior. Keep readable sources when useful. Serve on the LAN only when requested.
