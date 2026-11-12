# 3D starter

The 3D example uses the included Three.js r160 browser build, a perspective camera, simple geometry, standard materials and a shadow-casting directional light. It shares its rules and host with the 2D example. The starter is a small baseline; adapt the scene, input and rendering to the requested game.

`assets/template/3d.js` owns renderer setup, resize, camera-to-world movement and pointer projection onto the ground plane. The host advances game state on fixed steps and calls the render function each frame. Keep camera movement and pointer mapping coherent if changing the view.

The included Three.js license must remain in the bundled HTML. For a different renderer or newer module build, preserve its license, prebundle modules before single-file packaging, and verify the result offline.

Consider lighting, texture scale, shape and material response together. Enable expensive shadows or effects deliberately and measure on the intended devices. If WebGL fails, report it rather than presenting a fallback as an equivalent 3D result.
