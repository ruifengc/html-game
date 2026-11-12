/* Generate short example tones on demand; playback is handled by the host. */
(function (root) {
  function synthesize(name, variant, sampleRate) {
    const duration = name === 'objective' ? .32 : .12;
    const frames = Math.ceil(sampleRate * duration);
    const samples = new Float32Array(frames);
    const base = name === 'impact_metal' ? 145 : name === 'objective' ? 520 : 720;
    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      const envelope = Math.min(1, t / .008) * Math.exp(-t * (name === 'objective' ? 9 : 24));
      const pitch = base * (name === 'objective' ? 1 + .35 * t / duration : 1 - .25 * t / duration);
      samples[i] = Math.sin(2 * Math.PI * pitch * t) * envelope * .55;
    }
    return { ch: [samples], sr: sampleRate };
  }
  root.AudioSynthesis = { synthesize };
})(globalThis);
