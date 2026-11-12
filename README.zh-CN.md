# HTML Game

[English](README.md) | 简体中文

一个可复用的编程 agent skill 和工具集，用于构建可离线运行的单 HTML 浏览器游戏。图形、几何体、纹理和声音均可通过代码生成。

项目支持基于 Canvas 的 2D 游戏和基于 WebGL 的 3D 游戏，提供机制参考、基础运行工具、可编辑模板、单文件打包工具，以及结构和离线浏览器检查。模板是一个收集与躲避的小游戏，可根据目标游戏替换规则和视觉设计。

## 安装 skill

### 让 agent 安装

将下面的指令交给有 Git 访问权限的 agent：

> 克隆 `https://github.com/ruifengc/html-game.git`，阅读 README，并使用项目自带的安装脚本为我的 agent 安装这个 skill。如果已有安装，请先询问是否替换。

agent 需要能够通过 Git 访问仓库。安装脚本默认面向 Codex；其他 agent 可以通过 `--destination` 指定其 skill 目录。安装后如未发现 skill，请重启 agent 或刷新 skill 列表。

### 手动安装

```bash
git clone https://github.com/ruifengc/html-game.git
cd html-game
python3 scripts/install_skill.py
```

默认安装到 `$CODEX_HOME/skills/html-game`；未设置 `CODEX_HOME` 时安装到 `~/.codex/skills/html-game`。更新已有安装：

```bash
python3 scripts/install_skill.py --replace
```

用 `--destination /path/to/skills/html-game` 指定其他位置。安装结果自包含，不依赖保留项目目录。

使用示例：

> 使用 $html-game 制作一个单文件 3D 防御游戏，用代码生成几何体和声音，支持离线运行、键盘和触屏操作。

技能指令见 [SKILL.md](SKILL.md)。游戏语言和设计应遵循用户需求。

## 直接使用工具

创建、打包和静态检查需要 Python 3.10 或更高版本；项目检查还需要 Node.js 18 或更高版本。游戏运行时不需要 Node、npm 安装或服务器。

```bash
python3 scripts/new_game.py ./output/my-game --mode 2d --title "Light Courier"
# 使用 --mode 3d 创建 3D 模板。
# 编辑 output/my-game 中的 game-core.js、game.js、host.js 和 style.css。
python3 scripts/bundle_game.py ./output/my-game/index.html --output ./output/my-game/game.html
python3 scripts/verify_game.py ./output/my-game/game.html
```

直接在浏览器打开生成的 `game.html`，保留拆分后的源码以便继续开发。模板包含移动、收集、碰撞伤害、计时、暂停与重开、程序化声音及键盘和指针输入；这些只是起点，可按游戏需求调整。

## 可选浏览器检查

在安装了 Patchright 或 Playwright 及 Chromium 的 Python 环境中运行：

```bash
python3 scripts/verify_game.py ./output/my-game/game.html --browser --screenshot ./output/preview.png
```

检查会在禁止联网的环境中打开生成的文件，记录错误和请求，检查窄屏溢出，并在模板诊断接口存在时测试开始、移动、收集胜利、计时和碰撞失败及重开。

它不能证明任意新玩法正确、画面质量达标或所有设备性能良好。浏览器检查使用软件 WebGL，实际设备仍需单独测试。不加 `--browser` 时只进行结构检查；自定义游戏应根据自己的玩法编写测试。

## 项目内容

| 路径 | 用途 |
| --- | --- |
| `SKILL.md`、`agents/` | 技能指令及发现元数据 |
| `references/` | 程序化机制和渲染指导 |
| `assets/lib/` | 基础工具、音频模块及 Three.js 浏览器版本 |
| `assets/template/` | 可编辑的 2D/3D 示例玩法、渲染和输入界面 |
| `scripts/new_game.py` | 创建模板，不覆盖已有工作 |
| `scripts/bundle_game.py` | 按顺序内联本地脚本和样式 |
| `scripts/verify_game.py` | 结构检查与可选离线 Chromium 检查 |
| `scripts/install_skill.py` | 安装或显式替换 skill |
| `scripts/check.py`、`tests/` | 项目检查和行为测试 |

更多细节见[可组合机制](references/procedural-design.md)、[3D 运行库集成](references/3d-runtime.md)和[单文件约定与限制](references/single-file.md)。

## 运行边界

3D 模板使用 Three.js r160，提供基础相机、光照、几何体和阴影。它只是开发起点，不代表最终游戏的视觉质量。

打包工具支持入口目录内按序加载的经典脚本和本地样式；ES 模块需要预先打包。工具会拒绝未解析的资源引用和超出源目录的路径。动态 JavaScript 请求需要运行时检查；引擎中未调用的加载函数不代表实际加载了资源。

## 开发检查

```bash
python3 scripts/check.py
```

检查使用 Python 标准库和 Node 内置模块，创建临时产物，检查打包边界、示例游戏规则、库完整性和 JavaScript 语法。浏览器冒烟测试需另外运行。

内嵌 Three.js 的许可证保留在库文件及 [third-party/three-LICENSE.txt](third-party/three-LICENSE.txt) 中，依赖说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
