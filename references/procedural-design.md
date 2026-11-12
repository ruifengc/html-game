# Procedural game design

Choose techniques to support the game's interaction and artistic direction. A complete small loop with legible feedback is more useful than a catalogue of effects.

## Reusable patterns

- **Repeatable variation:** use a seeded random generator for reproducible layouts. Give independent systems separate streams so changing decoration does not unexpectedly alter gameplay.
- **Surfaces:** keep texture scale in world units and coordinate color, roughness and normal response. Cache generated textures; vary wear by plausible exposure rather than uniform noise.
- **Motion:** use damping for smooth following, and springs when overshoot or recoil is desired. Clamp long frame gaps or integrate in bounded steps.
- **Impact:** separate hit detection, state changes and presentation. Emit a single event to drive sound, particles and animation, and keep effects bounded.
- **Actors:** use clear silhouettes and telegraphs, collision shapes that match gameplay, and predictable cooldowns. Visual complexity does not guarantee fair interactions.
- **Sound:** generate a small palette of signals and cache samples. Limit concurrent voices and provide a mute control; resume the audio context after a gesture.
- **Atmosphere:** coordinate ambient light, direct light and material response. Treat reflections, shadows and post-processing as separate budget items; test on target hardware.
- **Animation:** keep procedural gait scheduling, target placement and joint solving separate. Transform targets into the coordinate system expected by the solver.

## Lifecycle and budget

Separate menu, playing, paused and terminal states. Reset input, clocks, scores and transient effects when restarting. Bound delta time when returning from a background tab; use fixed simulation steps when collision or determinism requires them. Dispose resources and listeners when a persistent scene is replaced.

Procedural content can reduce download size while increasing startup time, memory or GPU cost. Measure those costs, provide appropriate quality settings, and test the requested experience rather than assuming a template establishes visual quality.

The included examples use a small event dispatcher, seeded random generator, value noise and synthesized tones in `assets/lib/`. These are minimal starter utilities, not a general game engine.
