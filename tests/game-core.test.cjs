'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context=vm.createContext({console});
for(const file of ['assets/lib/core.js','assets/template/game-core.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const create=options=>context.ProceduralRules.create(options);
const farHazards=game=>{for(const h of game.state.hazards)h.baseX=h.baseZ=100;};

test('seeded restart reproduces layout and clears progress',()=>{
 const game=create({seed:42});game.start();
 const before=JSON.stringify(game.state.items);
 game.state.score=7;game.state.health=1;game.state.left=2;
 game.start();assert.equal(JSON.stringify(game.state.items),before);
 assert.equal(game.state.score,0);assert.equal(game.state.health,3);assert.equal(game.state.left,60);
});
test('diagonal movement stays normalized and position is bounded',()=>{
 const game=create();game.start();farHazards(game);
 game.update(.1,{x:1,z:1});assert.ok(Math.hypot(game.state.player.x,game.state.player.z)<=.450001);
 for(let i=0;i<1000;i++)game.update(1/60,{x:1,z:1});
 assert.ok(game.state.player.x<=8.8&&game.state.player.z<=8.8);
});
test('pause freezes gameplay and resumes the same run',()=>{
 const game=create();game.start();game.pause();const before=JSON.stringify(game.state);
 game.update(1,{x:1});assert.equal(JSON.stringify(game.state),before);
 game.pause();farHazards(game);game.update(.1,{x:1});assert.equal(game.state.phase,'playing');assert.ok(game.state.player.x>0);
});
test('collecting all active items wins once and terminal state stops updates',()=>{
 const game=create();game.start();farHazards(game);let finishes=0;game.events.on('finish',()=>finishes++);
 for(const item of game.state.items){game.state.player.x=item.x;game.state.player.z=item.z;game.update(1/60,{});}
 assert.equal(game.state.phase,'won');assert.equal(game.state.score,game.count);
 const before=JSON.stringify(game.state);game.update(1,{x:1});assert.equal(JSON.stringify(game.state),before);assert.equal(finishes,1);
});
test('timeout loses and a fresh start restores the timer',()=>{
 const game=create();game.start();farHazards(game);game.state.left=.001;game.update(.01,{});
 assert.equal(game.state.phase,'lost');game.start();assert.equal(game.state.left,60);assert.equal(game.state.phase,'playing');
});
test('collision consumes one shield, then invulnerability blocks repeated damage',()=>{
 const game=create();game.start();let hits=0;game.events.on('damage',()=>hits++);
 const h=game.state.hazards[0];h.baseX=-Math.sin(h.phase)*2;h.baseZ=-Math.cos(h.phase)*2;
 game.update(.001,{});assert.equal(game.state.health,2);game.update(.001,{});assert.equal(game.state.health,2);assert.equal(hits,1);
});
test('last shield collision ends the run',()=>{
 const game=create();game.start();game.state.health=1;const h=game.state.hazards[0];h.baseX=-Math.sin(h.phase)*2;h.baseZ=-Math.cos(h.phase)*2;
 game.update(.001,{});assert.equal(game.state.phase,'lost');assert.equal(game.state.health,0);
});
