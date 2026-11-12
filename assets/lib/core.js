/* Small utilities for the included example. */
(function (root) {
  function createRandom(seed) {
    let state = seed >>> 0 || 1;
    function next() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    }
    next.range = (min, max) => min + (max - min) * next();
    return next;
  }
  function createEvents() {
    const channels = new Map();
    return {
      on(name, listener) {
        const listeners = channels.get(name) || new Set();
        listeners.add(listener);
        channels.set(name, listeners);
        return () => listeners.delete(listener);
      },
      emit(name, detail) {
        for (const listener of Array.from(channels.get(name) || [])) listener(detail);
      }
    };
  }
  function createNoise(seed) {
    function point(x, y) {
      let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + (seed | 0);
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    }
    function sample(x, y) {
      const ix = Math.floor(x), iy = Math.floor(y);
      const tx = x - ix, ty = y - iy;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = point(ix, iy) * (1 - sx) + point(ix + 1, iy) * sx;
      const b = point(ix, iy + 1) * (1 - sx) + point(ix + 1, iy + 1) * sx;
      return a * (1 - sy) + b * sy;
    }
    return { fbm(x, y, octaves) {
      let sum = 0, weight = 1, total = 0;
      for (let i = 0; i < octaves; i++) {
        sum += sample(x, y) * weight; total += weight;
        x *= 2; y *= 2; weight *= .5;
      }
      return total ? sum / total : 0;
    }};
  }
  const api = { createRandom, createEvents, createNoise, clamp: (x, min, max) => Math.min(max, Math.max(min, x)) };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GameKit = api;
})(globalThis);
