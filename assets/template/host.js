/* Input, fixed-step lifecycle, feedback and bounded procedural audio playback. */
(function(root){
 const $=id=>document.getElementById(id),model=ProceduralRules.create(),keys=new Set();
 let ready=false,muted=false,target=null,dragging=false,render=()=>{},mapPointer=()=>null,last=0,accumulator=0,noticeUntil=0,audio=null,voices=0;
 const samples=new Map(),input={x:0,z:0,target:null};let viewKey='';
 function sound(name){
  if(muted||voices>=6||!root.AudioSynthesis)return;
  try{
   audio||=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});
   const key=name+'@'+audio.sampleRate;
   if(!samples.has(key))samples.set(key,AudioSynthesis.synthesize(name,0,audio.sampleRate));
   const pcm=samples.get(key),buffer=audio.createBuffer(pcm.ch.length,pcm.ch[0].length,pcm.sr);
   pcm.ch.forEach((ch,i)=>buffer.copyToChannel(ch,i));const source=audio.createBufferSource(),gain=audio.createGain();gain.gain.value=.13;source.buffer=buffer;source.connect(gain).connect(audio.destination);voices++;
   source.onended=()=>{voices--;source.disconnect();gain.disconnect()};source.start();
  }catch{$('notice').textContent='Sound unavailable; you can keep playing';noticeUntil=performance.now()+2500}
 }
 function refresh(){
  const s=model.state,key=[s.phase,s.score,s.health,Math.ceil(s.left),ready].join('|');if(key===viewKey)return;viewKey=key;$('hud').textContent=`Lights ${s.score}/${model.count} · Shield ${s.health} · ${Math.ceil(s.left)}s`;
  const panel=s.phase!=='playing';$('panel').hidden=!panel;$('pause').disabled=!ready||!['playing','paused'].includes(s.phase);$('pause').textContent=s.phase==='paused'?'Resume':'Pause';
  $('panel-title').textContent=s.phase==='won'?'All lights collected':s.phase==='lost'?'Try again':s.phase==='paused'?'Paused':document.title;
  $('message').innerHTML=s.phase==='won'?'Round complete.<br>Try again for a faster route.':s.phase==='lost'?'Lights are still waiting.<br>Avoid patrols and watch your shield and time.':s.phase==='paused'?'Resume this round.':'Collect 12 lights and avoid the patrols.<br>Use WASD, arrow keys or drag toward a destination.';
  $('start').textContent=s.phase==='paused'?'Resume':s.phase==='menu'?'Start':'Restart';
 }
 function clearInput(){keys.clear();target=null;dragging=false;input.x=input.z=0;input.target=null;accumulator=0}
 function start(){if(!ready)return;clearInput();noticeUntil=0;$('notice').textContent='';model.start();$('view').focus();sound('ui_click');refresh()}
 $('start').onclick=()=>{if(model.state.phase==='paused'){model.pause();$('view').focus();refresh()}else start()};
 $('pause').onclick=()=>{model.pause();clearInput();refresh()};
 $('mute').onclick=()=>{muted=!muted;$('mute').textContent=muted?'Sound: off':'Sound: on';$('mute').setAttribute('aria-pressed',String(muted));if(!muted)sound('ui_click')};
 addEventListener('keydown',event=>{
  if(['KeyP','Escape'].includes(event.code)&&ready){model.pause();clearInput();refresh();return}
  if(!['playing','paused'].includes(model.state.phase))return;
  if(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)){event.preventDefault();keys.add(event.code);target=null}
 });addEventListener('keyup',event=>keys.delete(event.code));addEventListener('blur',()=>{if(model.state.phase==='playing')model.pause();clearInput();refresh()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&model.state.phase==='playing')model.pause();clearInput();refresh()});
 const canvas=$('view');
 canvas.addEventListener('pointerdown',event=>{if(model.state.phase!=='playing')return;canvas.setPointerCapture(event.pointerId);canvas.focus();dragging=true;target=mapPointer(event.clientX,event.clientY)});
 canvas.addEventListener('pointermove',event=>{if(dragging)target=mapPointer(event.clientX,event.clientY)});
 const end=()=>{dragging=false};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
 model.events.on('collect',()=>sound('ui_click'));model.events.on('damage',()=>{sound('impact_metal');$('notice').textContent='Shield hit';noticeUntil=performance.now()+1000});
 model.events.on('state',refresh);model.events.on('finish',({phase})=>sound(phase==='won'?'objective':'impact_metal'));
 function frame(now){
  const delta=last?Math.min((now-last)/1000,.1):0;last=now;
  input.x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));input.z=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));input.target=target;if(host.transformMovement&&(input.x||input.z)){const world=host.transformMovement(input.x,input.z);input.x=world.x;input.z=world.z}
  accumulator+=delta;while(accumulator>=1/60){model.update(1/60,input);accumulator-=1/60}
  render(model.state,delta);refresh();if(now>noticeUntil)$('notice').textContent='';requestAnimationFrame(frame);
 }
 const host={model,rendererStats:null,transformMovement:null,begin(draw,pointer){render=draw;mapPointer=pointer;ready=true;document.documentElement.dataset.ready='true';$('start').disabled=false;refresh();requestAnimationFrame(frame)},fail(error){$('message').textContent='Startup failed: '+error.message;$('start').textContent='Startup failed';$('notice').textContent=error.message;console.error(error)}};
 root.GameHost=host;
 root.__game={get ready(){return ready},get state(){return model.state.phase},start,restart:start,stats:()=>({phase:model.state.phase,score:model.state.score,health:model.state.health,x:model.state.player.x,z:model.state.player.z}),step(seconds,move={}){for(let t=0;t<seconds-1e-9;t+=1/60)model.update(Math.min(1/60,seconds-t),move);render(model.state,0);refresh()},rendererStats:()=>host.rendererStats?.()||null};
})(globalThis);
