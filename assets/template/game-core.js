/* Small example rules. Replace this loop with the user's actual game design. */
(function(root){
 function create({seed=4207,count=12}={}){
  const events=GameKit.createEvents();
  const state={phase:'menu',score:0,health:3,left:60,elapsed:0,player:{x:0,z:0,invulnerable:0},items:[],hazards:[]};
  function reset(){
   const random=GameKit.createRandom(seed);
   Object.assign(state,{phase:'menu',score:0,health:3,left:60,elapsed:0});
   Object.assign(state.player,{x:0,z:0,invulnerable:0});state.items.length=state.hazards.length=0;
   for(let i=0;i<count;i++){
    const angle=random()*Math.PI*2,r=3+random()*5;
    state.items.push({x:Math.cos(angle)*r,z:Math.sin(angle)*r,on:true,phase:random()*Math.PI*2});
   }
   for(let i=0;i<4;i++)state.hazards.push({baseX:random.range(-6.5,6.5),baseZ:random.range(-6.5,6.5),x:8,z:8,phase:random()*6.28,speed:random.range(.5,1)});
   events.emit('state',state.phase);
  }
  function start(){reset();state.phase='playing';events.emit('state',state.phase)}
  function pause(){if(state.phase==='playing')state.phase='paused';else if(state.phase==='paused')state.phase='playing';else return;events.emit('state',state.phase)}
  function finish(phase){state.phase=phase;events.emit('finish',{phase,score:state.score});events.emit('state',phase)}
  function update(dt,input={}){
   if(state.phase!=='playing')return;
   state.elapsed+=dt;state.left=Math.max(0,state.left-dt);const p=state.player;p.invulnerable=Math.max(0,p.invulnerable-dt);
   let x=input.x||0,z=input.z||0;
   if(input.target&&!x&&!z){const dx=input.target.x-p.x,dz=input.target.z-p.z,d=Math.hypot(dx,dz);if(d>.1){const slow=Math.min(1,d/0.5);x=dx/d*slow;z=dz/d*slow}}
   const length=Math.max(1,Math.hypot(x,z));p.x=GameKit.clamp(p.x+x/length*4.5*dt,-8.8,8.8);p.z=GameKit.clamp(p.z+z/length*4.5*dt,-8.8,8.8);
   for(const item of state.items)if(item.on&&Math.hypot(p.x-item.x,p.z-item.z)<.7){item.on=false;state.score++;events.emit('collect',item)}
   if(state.score===count){finish('won');return}
   for(const h of state.hazards){h.x=h.baseX+Math.sin(state.elapsed*h.speed+h.phase)*2;h.z=h.baseZ+Math.cos(state.elapsed*h.speed*.8+h.phase)*2;if(!p.invulnerable&&Math.hypot(p.x-h.x,p.z-h.z)<.8){state.health--;p.invulnerable=1.5;events.emit('damage',h);if(state.health<=0){finish('lost');return}}}
   if(state.left<=0)finish('lost');
  }
  reset();return{state,events,count,reset,start,pause,update};
 }
 root.ProceduralRules={create};
})(globalThis);
