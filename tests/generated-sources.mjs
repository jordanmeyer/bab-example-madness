import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {easternDay,scores} from '../scripts/source-model.mjs';
const close=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-8,`${message}: ${a} != ${b}`);
const inputs=JSON.parse(await readFile(new URL('../data-inputs/opening-sources.json',import.meta.url)));
let options=0,snapshots=0;
for(const gender of ['mens','womens'])for(const year of [2016,2017,2018,2019,2021,2022,2023,2024,2025,2026]){
 const data=JSON.parse(await readFile(new URL(`../app/public/data/${gender==='womens'?'womens/':''}${year}.json`,import.meta.url)));
 const sources=inputs.filter(s=>s.competition===gender&&s.year===year);
 assert.deepEqual(data.forecastOptions.filter(o=>o.fit).map(o=>o.id),sources.map(s=>s.id));
 const ids=data.teams.map(t=>t.id).sort();
 for(const source of sources){
  assert.deepEqual(source.teams.map(t=>t.id).sort(),ids,'Exact complete opening membership');
  assert.ok(source.date<data.firstGameDate.slice(0,10));
 }
 for(const option of data.forecastOptions){
  options++;
  assert.equal(option.forecasts.length,1+new Set(data.games.map(g=>easternDay(g.date))).size);
  for(const [i,snapshot] of option.forecasts.entries()){
   snapshots++;
   assert.deepEqual(snapshot.teams.map(t=>t.id).sort(),ids);
   if(i)assert.ok(snapshot.date>option.forecasts[i-1].date);
   for(const team of snapshot.teams){
    team.p.forEach((p,stage)=>{
     assert.ok(Number.isFinite(p)&&p>=0&&p<=1+1e-12);
     if(stage)assert.ok(p<=team.p[stage-1]+1e-12,'Cumulative advancement');
    });
   }
   for(let s=0;s<7;s++)close(snapshot.teams.reduce((n,t)=>n+t.p[s],0),[64,32,16,8,4,2,1][s],'Stage mass');
   const completed=data.games.filter(g=>easternDay(g.date)<=snapshot.date);
   for(const game of completed){
    const winner=snapshot.teams.find(t=>t.id===game.winnerId);
    assert.equal(winner.p[game.round],1,'Known winner must have reached stage');
    const loser=snapshot.teams.find(t=>t.id===game.teamIds.find(id=>id!==game.winnerId));
    assert.equal(loser.alive,false);
    assert.ok(loser.p.slice(game.round).every(p=>p===0),'Known loser has no later chance');
   }
  }
  assert.equal(option.forecasts.at(-1).teams.find(t=>t.id===data.championTeamId).p[6],1);
 }
 const average=data.forecastOptions.find(o=>o.id==='average');
 assert.equal(Boolean(average),sources.length>1);
 if(average)for(const [i,f]of average.forecasts.entries())for(const t of f.teams)for(let s=0;s<7;s++){
  const parts=data.forecastOptions.filter(o=>o.fit).map(o=>o.forecasts[i]);
  if(i)assert.ok(parts.every(p=>p.date===f.date),'Average date alignment');
  close(t.p[s],parts.reduce((n,p)=>n+p.teams.find(row=>row.id===t.id).p[s],0)/parts.length,'Arithmetic average');
 }
 const ensemble=data.forecastOptions.find(o=>o.id==='ensemble');
 const supported=sources.every(s=>inputs.some(h=>h.competition===gender&&h.year<year&&h.id===s.id));
 assert.equal(Boolean(ensemble),supported);
 if(ensemble){assert.ok(ensemble.trainingYears.every(y=>y<year));assert.ok(ensemble.weights.every(Number.isFinite));}
 for(const fold of data.ensembleReport.folds){assert.ok(fold.year<year);assert.ok(fold.trainingYears.every(y=>y<fold.year));}
 for(const row of data.ensembleReport.rows){assert.ok(row.years.every(y=>y<year));close(row.improvement,row.brier-row.ensembleBrier,'Signed improvement');}
 if(gender==='womens'&&year===2024)assert.deepEqual(data.forecastOptions.map(o=>o.id),['silver']);
}
close(scores([[.8,1],[.4,0]]).brier,.1,'Hand-derived Brier');
close(scores([[.8,1],[.4,0]]).logLoss,-Math.log(.48)/2,'Hand-derived log loss');
assert.equal(inputs.length,37);
console.log(`PASS: 37 complete opening fields; ${options} source/blend options; ${snapshots} dated snapshots; exact field membership, probability bounds and totals, completed outcomes, averages, eligibility and chronological scoring.`);
