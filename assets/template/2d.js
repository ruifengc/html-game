/* Example Canvas renderer. All graphics are drawn/generated in code. */
(function(){
 const canvas=document.getElementById('view'),ctx=canvas.getContext('2d'),noise=GameKit.createNoise(77);let width=0,height=0,scale=1;
 const ground=document.createElement('canvas');ground.width=ground.height=128;const g=ground.getContext('2d'),image=g.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){const n=noise.fbm(x*.05,y*.05,3),i=(y*128+x)*4;image.data[i]=17+n*13;image.data[i+1]=43+n*17;image.data[i+2]=56+n*17;image.data[i+3]=255}g.putImageData(image,0,0);
 function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(width/22,height/24)}
 addEventListener('resize',resize);resize();const screen=(x,z)=>({x:width/2+x*scale,y:height*.53+z*scale});
 function circle(x,z,r,color){const p=screen(x,z);ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,r*scale,0,Math.PI*2);ctx.fill()}
 GameHost.begin((s)=>{
  ctx.fillStyle='#102732';ctx.fillRect(0,0,width,height);const corner=screen(-9.5,-9.5);ctx.drawImage(ground,corner.x,corner.y,19*scale,19*scale);
  ctx.strokeStyle='#829da722';ctx.lineWidth=1;ctx.beginPath();for(let i=-9;i<=9;i++){let a=screen(i,-9),b=screen(i,9);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);a=screen(-9,i);b=screen(9,i);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y)}ctx.stroke();ctx.strokeStyle='#90c4cf66';ctx.strokeRect(corner.x,corner.y,19*scale,19*scale);
  for(const item of s.items)if(item.on){const p=screen(item.x,item.z);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(s.elapsed*.8+item.phase);ctx.shadowColor='#f1d386';ctx.shadowBlur=12;ctx.fillStyle='#f1d386';ctx.fillRect(-scale*.2,-scale*.2,scale*.4,scale*.4);ctx.restore()}
  for(const h of s.hazards){circle(h.x+.12,h.z+.18,.55,'#07172088');circle(h.x,h.z,.48,'#d27d70');circle(h.x-.1,h.z-.12,.17,'#ffccaa')}
  const p=s.player;circle(p.x+.1,p.z+.18,.5,'#071720aa');if(!p.invulnerable||Math.sin(s.elapsed*30)>0){circle(p.x,p.z,.38,'#a5dce6');circle(p.x-.08,p.z-.1,.14,'#f4faf9')}
 },(x,y)=>({x:(x-width/2)/scale,z:(y-height*.53)/scale}));
})();
