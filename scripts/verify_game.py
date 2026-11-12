#!/usr/bin/env python3
"""Verify one HTML structurally, optionally smoke-test offline in Chromium."""
import argparse
import asyncio
import json
from pathlib import Path
from singlefile import static_errors

async def browser_check(path, timeout, screenshot=None):
    try:
        from patchright.async_api import async_playwright
    except ImportError:
        from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        context = await browser.new_context(viewport={'width': 800, 'height': 600}, offline=True)
        blocked, errors = [], []
        async def route(request_route):
            url = request_route.request.url
            if url.startswith(('http:', 'https:', 'ws:', 'wss:')):
                blocked.append(url)
                await request_route.abort()
            else:
                await request_route.continue_()
        await context.route('**/*', route)
        page = await context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
        cdp = await context.new_cdp_session(page)
        async def evaluate(expression):
            result = await cdp.send('Runtime.evaluate', {'expression': expression, 'returnByValue': True, 'awaitPromise': True})
            if 'exceptionDetails' in result:
                raise RuntimeError(str(result['exceptionDetails']))
            return result.get('result', {}).get('value')
        try:
            await page.goto(path.as_uri(), wait_until='load', timeout=timeout)
            hook = await evaluate('typeof window.__game !== "undefined"')
            checks = []
            if hook:
                await page.wait_for_function('document.documentElement.dataset.ready === "true"', timeout=timeout)
                await evaluate('window.__game.start()')
                before = await evaluate('window.__game.stats()')
                await evaluate('window.__game.step(0.5,{x:1,z:0})')
                after = await evaluate('window.__game.stats()')
                if before['phase'] != 'playing' or after['x'] <= before['x']:
                    raise AssertionError('Starter start/movement hook failed')
                checks += ['boot', 'start', 'movement']
                await evaluate('window.__game.restart()')
                reset = await evaluate('window.__game.stats()')
                if reset['score'] != 0 or reset['health'] != 3:
                    raise AssertionError('Restart did not reset state')
                checks.append('restart')
                rules = await evaluate('typeof window.GameHost?.model?.update === "function"')
                if rules:
                    terminal = await evaluate('''(() => {
                      const m=GameHost.model;
                      m.start();
                      for(const h of m.state.hazards)h.baseX=h.baseZ=100;
                      for(const item of m.state.items){m.state.player.x=item.x;m.state.player.z=item.z;m.update(1/60,{})}
                      const won=m.state.phase;
                      m.start();m.state.left=.001;m.update(.01,{});const timeout=m.state.phase;
                      m.start();m.state.health=1;m.state.player.invulnerable=0;
                      const h=m.state.hazards[0],t=m.state.elapsed+1/60;
                      m.state.player.x=h.baseX+Math.sin(t*h.speed+h.phase)*2;
                      m.state.player.z=h.baseZ+Math.cos(t*h.speed*.8+h.phase)*2;
                      m.update(1/60,{});const hit=m.state.phase;window.__game.restart();
                      return {won,timeout,hit};
                    })()''')
                    if terminal != {'won': 'won', 'timeout': 'lost', 'hit': 'lost'}:
                        raise AssertionError('Starter terminal rules failed: '+str(terminal))
                    checks += ['collection-win-rule', 'timeout-loss-rule', 'collision-loss-rule']

            else:
                await page.wait_for_timeout(500)
                checks.append('page-load-only: no starter diagnostic hook')
            if screenshot:
                screenshot.parent.mkdir(parents=True, exist_ok=True)
                await page.screenshot(path=str(screenshot))
            await page.set_viewport_size({'width': 390, 'height': 844})
            await page.wait_for_timeout(200)
            if await evaluate('document.documentElement.scrollWidth > innerWidth'):
                raise AssertionError('Horizontal page overflow at 390px')
            checks.append('resize')
            runtime = await evaluate('window.__game?.rendererStats?.() || null')
            return {'checks': checks, 'network_attempts': blocked, 'errors': errors, 'renderer': runtime}
        finally:
            await browser.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('html')
    parser.add_argument('--browser', action='store_true')
    parser.add_argument('--timeout', type=int, default=180000)
    parser.add_argument('--screenshot', type=Path, help='Optional browser screenshot before mobile resize')
    args = parser.parse_args()
    path = Path(args.html).resolve()
    doc, errors = static_errors(path.read_text())
    result = {'file': str(path), 'bytes': path.stat().st_size, 'static_errors': errors, 'inline_scripts': len(doc.scripts), 'browser': None}
    if args.browser and not errors:
        result['browser'] = asyncio.run(browser_check(path, args.timeout, args.screenshot))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    failed = bool(errors) or bool(result['browser'] and (result['browser']['errors'] or result['browser']['network_attempts']))
    raise SystemExit(int(failed))

if __name__ == '__main__':
    main()
