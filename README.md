# HTML Game

English | [Chinese (Simplified)](README.zh-CN.md)

A reusable coding-agent skill and small toolchain for building playable, offline browser games as a single HTML file. Graphics, geometry, textures and sound are generated in code.

The project supports Canvas-based 2D games and WebGL-based 3D games. It includes mechanism references, small starter utilities, editable starters, a single-file packager and structural/offline browser checks. The starter is a small collection-and-avoidance example; replace its rules and visual direction with the intended game.

## Install the skill

### Ask your agent to install it

Give an agent with Git access this prompt:

> Clone `https://github.com/ruifengc/html-game.git`, read its README and install the skill for my agent using the included installer. If an installation already exists, ask before replacing it.

The agent needs Git access to the repository. The default installer targets Codex; for another agent, choose its skill directory with `--destination`. Restart the agent or refresh its skills if needed to discover the installation.

### Install manually

Clone this repository, then install its skill payload:

```bash
git clone https://github.com/ruifengc/html-game.git
cd html-game
python3 scripts/install_skill.py
```

The default destination is `$CODEX_HOME/skills/html-game`, or `~/.codex/skills/html-game` when `CODEX_HOME` is unset. Update an existing installation explicitly:

```bash
python3 scripts/install_skill.py --replace
```

Use `--destination /path/to/skills/html-game` for a different agent's skill directory. Installation copies a self-contained payload; it does not require the checkout to remain in place.

Example invocation:

> Use $html-game to build a single-file 3D defense game with procedural geometry and sound. It should run offline and support keyboard and touch input.

The skill instructions are in [SKILL.md](SKILL.md). Player-facing language and game design should follow the user's brief.

## Use the tools directly

Python 3.10+ is sufficient for scaffolding, packaging and static checks. Node.js 18+ is used by the project checks. The runtime does not require Node, npm installation or a server.

```bash
# Create editable source in a new or empty directory.
python3 scripts/new_game.py ./output/my-game --mode 2d --title "Light Courier"
# Use --mode 3d for the WebGL starter.

# Edit output/my-game/game-core.js, game.js, host.js and style.css.
# Bundle the actual artifact, preserving script order.
python3 scripts/bundle_game.py ./output/my-game/index.html --output ./output/my-game/game.html

# Verify loaded resource references and CSS dependencies.
python3 scripts/verify_game.py ./output/my-game/game.html
```

Open the generated `game.html` directly in a browser. Keep its split source for further iteration. The starter includes movement, collection, collision damage, a timer, pause/restart, procedural sound and keyboard/pointer input. These are scaffolding examples rather than requirements for every new game.

## Optional browser checks

Run with Python containing Patchright or Playwright and an installed Chromium browser:

```bash
python3 scripts/verify_game.py ./output/my-game/game.html --browser --screenshot ./output/preview.png
```

The runner opens the **file artifact** with networking blocked, records errors and attempted requests, checks narrow-screen overflow, and exercises starter diagnostics when present. It covers start, movement, collection victory, timer/collision defeat and restart in the included starters.

It does not prove that an arbitrary new mechanic is correct, that artwork is good, or that performance is acceptable on every device. The browser runner uses a software WebGL configuration for portability; test actual target hardware separately. Without `--browser`, verification is structural only. For a custom game's diagnostics, adapt its gameplay tests instead of assuming the starter hook contract still applies.

## Project contents

| Path | Purpose |
| --- | --- |
| `SKILL.md`, `agents/` | Skill instructions and discovery metadata |
| `references/` | Procedural design and rendering guidance |
| `assets/lib/` | Starter utility and audio modules, plus the Three.js browser build |
| `assets/template/` | Editable 2D/3D example loop, renderer and input/UI host |
| `scripts/new_game.py` | Copy an editable starter without overwriting work |
| `scripts/bundle_game.py` | Inline local classic scripts and styles |
| `scripts/verify_game.py` | Structural checks and optional offline Chromium smoke checks |
| `scripts/install_skill.py` | Install or explicitly replace the skill payload |
| `scripts/check.py`, `tests/` | Portable project checks and behavioral tests |

Detailed guidance:

- [Composable mechanisms](references/procedural-design.md)
- [3D runtime integration](references/3d-runtime.md)
- [Single-file contract and limitations](references/single-file.md)

## Runtime boundaries

The 3D starter uses Three.js r160 with a simple camera, lighting, geometry and shadows. It is a starting point, not a production renderer or a promise of visual quality.

The packager supports ordered classic scripts and local stylesheets under the entry directory. Prebundle ES modules before using it. It rejects unresolved resource references and paths escaping the source directory. Dynamic JavaScript requests require runtime inspection; a dormant loader function in a bundled engine is not itself a loaded resource.

## Development checks

```bash
python3 scripts/check.py
```

Checks use standard-library Python and Node built-ins, create temporary artifacts, verify packaging boundaries, exercise the example game rules, check library integrity and parse JavaScript. Browser smoke checks are optional and run separately.

The embedded Three.js license is retained in the library and in [third-party/three-LICENSE.txt](third-party/three-LICENSE.txt). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the dependency notice.
