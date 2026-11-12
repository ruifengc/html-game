/* Small Three.js arena. Replace the example world for each new game. */
(function () {
  try {
    const canvas = document.getElementById('view');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12262e);
    const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
    camera.position.set(-10, 14, 17);
    const target = new THREE.Vector3();
    camera.lookAt(target);
    scene.add(new THREE.HemisphereLight(0xc6e3ed, 0x29332c, 2));
    const sun = new THREE.DirectionalLight(0xffe4bd, 2.4);
    sun.position.set(-7, 14, 8); sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: .5, far: 40 });
    sun.shadow.mapSize.set(1024, 1024); scene.add(sun);
    const material = (color, roughness=.65) => new THREE.MeshStandardMaterial({ color, roughness });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(19, .25, 19), material(0x304d55));
    floor.position.y = -.17; floor.receiveShadow = true; scene.add(floor);
    const rail = material(0x62919a);
    for (const [w,d,x,z] of [[19.5,.3,0,-9.7],[19.5,.3,0,9.7],[.3,19.5,-9.7,0],[.3,19.5,9.7,0]]) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,.6,d), rail);
      mesh.position.set(x,.1,z); mesh.castShadow = true; scene.add(mesh);
    }
    const player = new THREE.Mesh(new THREE.CapsuleGeometry(.28,.35,4,12), material(0xa5dce6));
    player.position.y = .5; player.castShadow = true; scene.add(player);
    const itemGeometry = new THREE.OctahedronGeometry(.27);
    const itemMaterial = new THREE.MeshStandardMaterial({color:0xf1c56f,emissive:0xaa6b1f,emissiveIntensity:.8});
    const items = GameHost.model.state.items.map(() => { const mesh = new THREE.Mesh(itemGeometry,itemMaterial); scene.add(mesh); return mesh; });
    const hazardGeometry = new THREE.SphereGeometry(.46,20,12), hazardMaterial = material(0xd27d70);
    const hazards = GameHost.model.state.hazards.map(() => { const mesh = new THREE.Mesh(hazardGeometry,hazardMaterial); mesh.castShadow = true; scene.add(mesh); return mesh; });
    function resize() { renderer.setPixelRatio(Math.min(devicePixelRatio || 1,2)); renderer.setSize(innerWidth,innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }
    addEventListener('resize',resize); resize();
    const forward=new THREE.Vector3(),right=new THREE.Vector3(),movement={x:0,z:0};
    GameHost.transformMovement=(x,z)=>{camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,camera.up).normalize();movement.x=right.x*x-forward.x*z;movement.z=right.z*x-forward.z*z;return movement};
    const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3(),uv=new THREE.Vector2(),desired=new THREE.Vector3();
    GameHost.rendererStats=()=>({renderer:'WebGL',shadows:renderer.shadowMap.enabled});
    GameHost.begin((s,dt)=>{
      player.position.set(s.player.x,.5,s.player.z);player.visible=!s.player.invulnerable||Math.sin(s.elapsed*30)>0;
      for(let i=0;i<items.length;i++){const m=items[i],item=s.items[i];m.visible=item.on;m.position.set(item.x,.65+Math.sin(s.elapsed*2+item.phase)*.1,item.z);m.rotation.y=s.elapsed*.8+item.phase}
      for(let i=0;i<hazards.length;i++)hazards[i].position.set(s.hazards[i].x,.5,s.hazards[i].z);
      desired.set(s.player.x*.12,0,s.player.z*.12);target.lerp(desired,1-Math.exp(-3*dt));camera.lookAt(target);renderer.render(scene,camera);
    },(x,y)=>{const box=canvas.getBoundingClientRect();uv.set((x-box.left)/box.width*2-1,-(y-box.top)/box.height*2+1);ray.setFromCamera(uv,camera);return ray.ray.intersectPlane(plane,hit)?{x:hit.x,z:hit.z}:null});
    addEventListener('pagehide',event=>{if(!event.persisted)renderer.dispose()});
  } catch(error) { GameHost.fail(error); }
})();
