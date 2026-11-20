'use strict';const test=require('node:test');const assert=require('node:assert/strict');const G=require('../game-logic');
function room(n=7){const r=G.makeRoom('Narrator');for(let i=0;i<n;i++)G.addPlayer(r,'Player'+i);return r}
test('random codes and unique session credentials',()=>{let a=room();assert.match(a.code,/^[A-Z2-9]{6}$/);assert.equal(new Set(a.players.map(x=>x.token)).size,a.players.length)});
test('role counts and mafia teammate privacy',()=>{const r=room();r.settings={mafia:3,silencer:1,doctor:true,detective:true};G.start(r);assert.equal(r.players.filter(x=>x.role==='mafia_silencer').length,1);assert.equal(r.players.filter(x=>x.role==='mafia_killer').length,2);const maf=r.players.find(p=>p.role==='mafia_silencer');const civ=r.players.find(p=>p.role==='civilian');assert.equal(G.project(r,{token:maf.token}).teammates.length,2);assert.equal(G.project(r,{token:civ.token}).teammates.length,0);assert.equal(G.project(r,{token:civ.token}).players.some(p=>p.role),false)});
test('silencers may target themselves or mafia teammates; killers cannot target allied Mafia',()=>{const r=room();r.settings={mafia:2,silencer:1,doctor:true,detective:true};G.start(r);const sil=r.players.find(p=>p.role==='mafia_silencer');const killer=r.players.find(p=>p.role==='mafia_killer');G.submitAction(r,sil,killer.id);assert.equal(r.actions[sil.id],killer.id);G.submitAction(r,sil,sil.id);assert.equal(r.actions[sil.id],sil.id);assert.throws(()=>G.submitAction(r,killer,sil.id),/فريق المافيا/);assert.throws(()=>G.submitAction(r,killer,killer.id),/فريق المافيا/);G.resolveNight(r);assert.equal(G.project(r,{token:sil.token}).self.silenced,true)});
test('silencer becomes killing mafia when last killer is eliminated and card role changes',()=>{const r=room();r.settings={mafia:2,silencer:1,doctor:false,detective:false};G.start(r);const k=r.players.find(p=>p.role==='mafia_killer'),s=r.players.find(p=>p.role==='mafia_silencer');r.phase='day';const result=G.eliminate(r,k.id);assert.deepEqual(result.promotions,[s.name]);assert.equal(s.role,'mafia_killer');assert.equal(G.project(r,{token:s.token}).self.role,'mafia_killer');assert.equal(G.project(r,{token:s.token}).teammates.length,1);});
test('no promotion while another killing mafia remains',()=>{const r=room();r.settings={mafia:3,silencer:1,doctor:false,detective:false};G.start(r);const killers=r.players.filter(p=>p.role==='mafia_killer'),sil=r.players.find(p=>p.role==='mafia_silencer');r.phase='day';G.eliminate(r,killers[0].id);assert.equal(sil.role,'mafia_silencer');G.nextNight(r);r.phase='day';G.eliminate(r,killers[1].id);assert.equal(sil.role,'mafia_killer')});
test('unanimous kill blocked by doctor and silencing affects day',()=>{const r=room(8);r.settings={mafia:3,silencer:1,doctor:true,detective:true};G.start(r);const ks=r.players.filter(p=>p.role==='mafia_killer'),sil=r.players.find(p=>p.role==='mafia_silencer'),doc=r.players.find(p=>p.role==='doctor'),victim=r.players.find(p=>p.role==='civilian');for(const k of ks)G.submitAction(r,k,victim.id);G.submitAction(r,doc,victim.id);G.submitAction(r,sil,victim.id);const summary=G.resolveNight(r);assert.equal(summary.killed,null);assert.equal(summary.saved,true);assert.equal(G.project(r,{token:victim.token}).self.silenced,true);assert.equal(r.phase,'day')});
test('mismatched killers have no kill',()=>{const r=room(8);r.settings={mafia:2,silencer:0,doctor:false,detective:false};G.start(r);const [a,b]=r.players.filter(p=>p.role==='mafia_killer'),t=r.players.filter(p=>p.role==='civilian');G.submitAction(r,a,t[0].id);G.submitAction(r,b,t[1].id);const s=G.resolveNight(r);assert.equal(s.killed,null)});

test('one elimination per day; next night resets the guard',()=>{const r=room(7);r.settings={mafia:1,silencer:0,doctor:false,detective:false};G.start(r);r.phase='day';const civilians=r.players.filter(p=>p.role==='civilian');G.eliminate(r,civilians[0].id);assert.throws(()=>G.eliminate(r,civilians[1].id),/بالفعل/);G.nextNight(r);assert.equal(r.dayEliminated,false)});


test('leave during live game is a permanent forfeit, clears actions and denies private state',()=>{
 const r=room(8);r.settings={mafia:2,silencer:1,doctor:true,detective:true};G.start(r);
 const player=r.players.find(p=>p.role==='civilian');const oldToken=player.token;
 const killer=r.players.find(p=>p.role==='mafia_killer');G.submitAction(r,killer,player.id);
 const result=G.leavePlayer(r,killer);
 assert.equal(result.forfeited,true);assert.equal(killer.alive,false);assert.equal(killer.left,true);
 assert.deepEqual(result.promotions,[r.players.find(p=>p.role==='mafia_killer'&&p.alive).name]);
 assert.equal(r.actions[killer.id],undefined);assert.equal(G.project(r,{token:killer.token}),null);
 assert.equal(G.project(r,{token:oldToken}).self.alive,true);
 assert.throws(()=>G.submitAction(r,killer,player.id));
});

test('leaving lobby removes the player; restart does not restore quitters',()=>{
 const r=room(7);const p=r.players[0];G.leavePlayer(r,p);
 assert.equal(r.players.length,6);assert.equal(r.players.includes(p),false);
 r.settings={mafia:2,silencer:1,doctor:false,detective:false};G.start(r);
 const q=r.players.find(x=>x.role==='civilian');G.leavePlayer(r,q);r.phase='finished';
 G.resetGame(r);assert.equal(r.players.includes(q),false);assert.equal(r.phase,'lobby');
});

test('losing the final living Mafia by leaving ends the game for innocents',()=>{
 const r=room(6);r.settings={mafia:1,silencer:0,doctor:false,detective:false};G.start(r);
 const killer=r.players.find(p=>p.role==='mafia_killer');G.leavePlayer(r,killer);
 assert.equal(r.winner,'town');assert.equal(r.phase,'finished');
});


test('leaving cancels actions that target the quitter',()=>{
 const r=room(7);r.settings={mafia:1,silencer:0,doctor:true,detective:false};G.start(r);
 const killer=r.players.find(p=>p.role==='mafia_killer');const target=r.players.find(p=>p.role==='civilian');
 G.submitAction(r,killer,target.id);assert.equal(r.actions[killer.id],target.id);
 G.leavePlayer(r,target);assert.equal(r.actions[killer.id],undefined);
 const result=G.resolveNight(r);assert.equal(result.killed,null);
});

test('silencer promoted mid-night must choose a fresh killing target',()=>{
 const r=room(8);r.settings={mafia:2,silencer:1,doctor:false,detective:false};G.start(r);
 const killer=r.players.find(p=>p.role==='mafia_killer');const silencer=r.players.find(p=>p.role==='mafia_silencer');const victim=r.players.find(p=>p.role==='civilian');
 G.submitAction(r,silencer,victim.id);G.leavePlayer(r,killer);
 assert.equal(silencer.role,'mafia_killer');assert.equal(r.actions[silencer.id],undefined);
 assert.equal(G.resolveNight(r).killed,null);
});

// Version 4.5 rule/regression coverage. No client-provided roles or results are trusted.
test('Silencer cannot repeat a target in consecutive rounds, can alternate and return later',()=>{
 const r=room(8);r.settings={mafia:2,silencer:1,doctor:false,detective:false};G.start(r);
 const sil=r.players.find(p=>p.role==='mafia_silencer'),other=r.players.find(p=>p.role==='mafia_killer');
 G.submitAction(r,sil,other.id);G.resolveNight(r);G.nextNight(r);
 assert.throws(()=>G.submitAction(r,sil,other.id),/متتاليتين/);
 assert.equal(G.project(r,{token:sil.token}).self.blockedTargetId,other.id);
 G.submitAction(r,sil,sil.id);assert.equal(r.actions[sil.id],sil.id);
 G.resolveNight(r);G.nextNight(r);
 assert.throws(()=>G.submitAction(r,sil,sil.id),/متتاليتين/);
 assert.doesNotThrow(()=>G.submitAction(r,sil,other.id));
});
test('Doctor cannot protect the same player in consecutive rounds, including themselves',()=>{
 const r=room(8);r.settings={mafia:1,silencer:0,doctor:true,detective:false};G.start(r);
 const doctor=r.players.find(p=>p.role==='doctor'),other=r.players.find(p=>p.role==='civilian');
 G.submitAction(r,doctor,doctor.id);G.resolveNight(r);G.nextNight(r);
 assert.throws(()=>G.submitAction(r,doctor,doctor.id),/متتاليتين/);
 G.submitAction(r,doctor,other.id);G.resolveNight(r);G.nextNight(r);
 assert.throws(()=>G.submitAction(r,doctor,other.id),/متتاليتين/);
 assert.doesNotThrow(()=>G.submitAction(r,doctor,doctor.id));
});
test('A skipped action breaks the consecutive-round target restriction',()=>{
 const r=room(8);r.settings={mafia:1,silencer:0,doctor:true,detective:false};G.start(r);
 const d=r.players.find(p=>p.role==='doctor'),target=r.players.find(p=>p.role==='civilian');
 G.submitAction(r,d,target.id);G.resolveNight(r);G.nextNight(r);
 G.resolveNight(r);G.nextNight(r);
 assert.doesNotThrow(()=>G.submitAction(r,d,target.id));
});
test('Detective results distinguish confirmed Mafia from cleared player and remain narrator-only',()=>{
 const r=room(9);r.settings={mafia:2,silencer:1,doctor:false,detective:true};G.start(r);
 const detective=r.players.find(p=>p.role==='detective'),maf=r.players.find(p=>p.role==='mafia_killer'),civilian=r.players.find(p=>p.role==='civilian');
 G.submitAction(r,detective,maf.id);let result=G.resolveNight(r);
 assert.deepEqual(result.investigations,[{by:detective.name,target:maf.name,isMafia:true}]);
 assert.deepEqual(G.project(r,{token:r.host.token}).summary.investigations,result.investigations);
 assert.equal(G.project(r,{token:detective.token}).self.investigations.at(-1).isMafia,true);
 assert.equal(Object.hasOwn(G.project(r,{token:civilian.token}),'summary'),false);
 assert.equal(Object.hasOwn(G.project(r,{token:civilian.token}),'investigations'),false);
 G.nextNight(r);G.submitAction(r,detective,civilian.id);result=G.resolveNight(r);
 assert.deepEqual(result.investigations,[{by:detective.name,target:civilian.name,isMafia:false}]);
});
test('Move counters and secret actions are exposed to narrator but not to players',()=>{
 const r=room(8);r.settings={mafia:2,silencer:1,doctor:true,detective:true};G.start(r);
 const host=G.project(r,{token:r.host.token});
 assert.ok(host.progress.total>0);assert.ok(Array.isArray(host.actions));
 for(const p of r.players){const view=G.project(r,{token:p.token});assert.equal(Object.hasOwn(view,'progress'),false);assert.equal(Object.hasOwn(view,'actions'),false);assert.equal(Object.hasOwn(view,'summary'),false)}
});
test('Narrator can kick a player in the lobby; room list is clean and old token invalidated',()=>{
 const r=room(7),p=r.players[2];const oldToken=p.token;
 assert.equal(G.kickPlayer(r,p.id).forfeited,false);
 assert.equal(r.players.length,6);assert.equal(G.project(r,{token:oldToken}),null);
 assert.equal(G.project(r,{token:r.host.token}).players.length,6);
 assert.throws(()=>G.kickPlayer(r,p.id),/غير موجود/);
});
test('Narrator kick during active play clears target actions and promotes a Silencer',()=>{
 const r=room(8);r.settings={mafia:2,silencer:1,doctor:true,detective:false};G.start(r);
 const killer=r.players.find(p=>p.role==='mafia_killer'),silencer=r.players.find(p=>p.role==='mafia_silencer'),civilian=r.players.find(p=>p.role==='civilian');
 G.submitAction(r,killer,civilian.id);G.submitAction(r,silencer,civilian.id);
 const oldToken=killer.token;
 const result=G.kickPlayer(r,killer.id);
 assert.equal(result.forfeited,true);
 assert.deepEqual(result.promotions,[silencer.name]);
 assert.equal(silencer.role,'mafia_killer');assert.equal(r.actions[silencer.id],undefined);
 assert.equal(G.project(r,{token:oldToken}),null);
 assert.equal(G.project(r,{token:r.host.token}).players.some(p=>p.id===killer.id),false);
});
test('Narrator kick invalidates a kicked targeted civilian and clears pending selections',()=>{
 const r=room(8);r.settings={mafia:1,silencer:0,doctor:false,detective:false};G.start(r);
 const killer=r.players.find(p=>p.role==='mafia_killer'),civilian=r.players.find(p=>p.role==='civilian');
 G.submitAction(r,killer,civilian.id);G.kickPlayer(r,civilian.id);
 assert.equal(r.actions[killer.id],undefined);
 assert.equal(G.project(r,{token:r.host.token}).players.some(p=>p.id===civilian.id),false);
});
test('Resetting a game clears prior Doctor/Silencer target history',()=>{
 const r=room(8);r.settings={mafia:2,silencer:1,doctor:true,detective:false};G.start(r);
 const doc=r.players.find(p=>p.role==='doctor');G.submitAction(r,doc,doc.id);G.resolveNight(r);
 G.resetGame(r);assert.ok(r.players.every(p=>Object.keys(p.lastTargets).length===0));
});
