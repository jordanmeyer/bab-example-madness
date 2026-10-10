import {fitLogistic,predict,logit,scores} from './source-model.mjs';
const mean=values=>values.reduce((a,b)=>a+b,0)/values.length;

// All earlier seasons with an applicable source contribute. Missing historical
// source features use that game's mean available log-odds, never future values.
// Every currently selected input must have genuine earlier observations before
// exposing an "all source" fitted option.
export function trainingRows(history, sourceIds, cutoff) {
 const rows=[], support=new Set(), trainingYears=new Set();
 for(const {year, data, sources} of history.filter(h=>h.year<cutoff)) {
  const applicable=sources.filter(s=>sourceIds.includes(s.id));
  if(!applicable.length) continue;
  applicable.forEach(s=>support.add(s.id)); trainingYears.add(year);
  const games=data.games.filter(g=>g.status!=='no-contest');
  for(const g of games){
   const key=g.teamIds.join(':');
   const logits=new Map(applicable.map(s=>[s.id,logit(s.matrix[key])]));
   const fill=mean([...logits.values()]);
   rows.push({year,gameId:g.id,x:sourceIds.map(id=>logits.get(id)??fill),y:Number(g.teamIds[0]===g.winnerId),weight:1/games.length});
  }
 }
 const count=trainingYears.size;
 rows.forEach(row=>row.weight/=count);
 return {rows,years:[...trainingYears].sort(),missingInputs:sourceIds.filter(id=>!support.has(id))};
}

export function fitAt(history,ids,year){
 const training=trainingRows(history,ids,year);
 return {...training,weights:training.rows.length&&!training.missingInputs.length?fitLogistic(training.rows,ids.length):null};
}

export function historyReport(history,currentIds,year){
 const records=[];
 for(const held of history.filter(h=>h.year<year)){
  const available=held.sources.filter(s=>currentIds.includes(s.id));
  const ids=available.map(s=>s.id);
  if(!ids.length)continue;
  const fitted=fitAt(history,ids,held.year);
  if(!fitted.weights)continue;
  const pairs=Object.fromEntries([...ids,'average','ensemble'].map(id=>[id,[]]));
  for(const game of held.data.games.filter(g=>g.status!=='no-contest')){
   const ps=available.map(s=>s.matrix[game.teamIds.join(':')]);
   const y=Number(game.teamIds[0]===game.winnerId);
   ids.forEach((id,i)=>pairs[id].push([ps[i],y]));
   pairs.average.push([mean(ps),y]);pairs.ensemble.push([predict(fitted.weights,ps),y]);
  }
  records.push({year:held.year,sourceIds:ids,trainingYears:fitted.years,weights:fitted.weights,metrics:Object.fromEntries(Object.entries(pairs).map(([id,p])=>[id,scores(p)]))});
 }
 const rows=[...currentIds,'average','ensemble'].flatMap(id=>{
  const comparable=records.filter(r=>r.metrics[id]&&(id!=='average'||r.sourceIds.length>1));
  if(!comparable.length)return [];
  const brier=mean(comparable.map(r=>r.metrics[id].brier)), ensembleBrier=mean(comparable.map(r=>r.metrics.ensemble.brier));
  return [{id,years:comparable.map(r=>r.year),games:comparable.reduce((n,r)=>n+r.metrics[id].games,0),brier,logLoss:mean(comparable.map(r=>r.metrics[id].logLoss)),ensembleBrier,ensembleLogLoss:mean(comparable.map(r=>r.metrics.ensemble.logLoss)),improvement:brier-ensembleBrier,relativeImprovement:brier?(brier-ensembleBrier)/brier:null}];
 });
 return {method:'Expanding-window tests: each tested season uses only earlier seasons to fit. Equal weight per season. Individual comparisons use exactly the same games as their ensemble comparator. Available source sets vary by historical season; this tests the blending procedure, not today’s fitted coefficients.',rows,folds:records};
}

