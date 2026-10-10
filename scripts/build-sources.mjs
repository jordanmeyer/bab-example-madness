import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {bracketTree, reconstruct, timeline, predict} from './source-model.mjs';

import {fitAt,historyReport} from './ensemble.mjs';

const root=resolve(import.meta.dirname,'..');
const output=resolve(process.argv[2] ?? `${root}/app/public/data`);
const inputs=JSON.parse(await readFile(`${root}/data-inputs/opening-sources.json`));
const tournaments=new Map(), models=[];
for(const source of inputs){
 const key=`${source.competition}/${source.year}`;
 if(!tournaments.has(key)) tournaments.set(key,JSON.parse(await readFile(`${root}/app/public/data/${source.competition==='womens'?'womens/':''}${source.year}.json`)));
 const data=tournaments.get(key);
 if(source.date>=data.firstGameDate.slice(0,10)) throw new Error(`${key}/${source.id}: opening must predate first game`);
 const {matrix,fit}=reconstruct(bracketTree(data),source.teams);
 if(fit.maxError>.005) throw new Error(`${key}/${source.id}: opening residual exceeds 0.5 percentage point; inspect input`);
 models.push({...source,matrix,fit});
 console.log(`${key}/${source.id}: maximum adjustment ${(fit.maxError*100).toFixed(4)} percentage points`);
}

const years=gender=>[...new Set(models.filter(s=>s.competition===gender).map(s=>s.year))].sort();
const sourcesAt=(gender,year)=>models.filter(s=>s.competition===gender&&s.year===year);
const mean=values=>values.reduce((a,b)=>a+b,0)/values.length;


const audit=[];
for(const gender of ['mens','womens']){
 const history=years(gender).map(year=>({year,data:tournaments.get(`${gender}/${year}`),sources:sourcesAt(gender,year)}));
 for(const {year,data,sources} of history){
  const ids=sources.map(s=>s.id),fitted=fitAt(history,ids,year);
  const options=sources.map(s=>({id:s.id,name:s.name,date:s.date,dateKnown:s.dateKnown,url:s.url,notes:s.notes,fit:{maxError:s.fit.maxError,meanError:s.fit.meanError,maxNodeResidual:s.fit.maxNodeResidual},forecasts:timeline(data,s.matrix,s.date)}));
  const blendDate=sources.map(s=>s.date).sort().at(-1);
  if(sources.length>1){
   const dates=timeline(data,sources[0].matrix,blendDate).map(f=>f.date);
   const forecasts=dates.map((date,i)=>({date,kind:'reconstructed',teams:data.teams.map(team=>({id:team.id,p:Array.from({length:7},(_,stage)=>mean(options.map(o=>o.forecasts[i].teams.find(t=>t.id===team.id).p[stage]))),alive:options[0].forecasts[i].teams.find(t=>t.id===team.id).alive}))}));
   options.push({id:'average',name:'All source average',sourceIds:ids,forecasts});
  }
  if(fitted.weights){
   const matrix=Object.fromEntries(Object.keys(sources[0].matrix).map(key=>[key,predict(fitted.weights,sources.map(s=>s.matrix[key]))]));
   options.push({id:'ensemble',name:'All source ensemble',sourceIds:ids,trainingYears:fitted.years,weights:fitted.weights,trainingGames:fitted.rows.length,forecasts:timeline(data,matrix,blendDate)});
  }
  const report=historyReport(history,ids,year);
  data.forecastOptions=options;
  data.ensembleReport={...report,sourceNames:Object.fromEntries(sources.map(s=>[s.id,s.name])),trainingYears:fitted.years,missingInputs:fitted.missingInputs,eligible:Boolean(fitted.weights)};
  const folder=gender==='womens'?'womens/':'';
  await mkdir(`${output}/${folder}`,{recursive:true});
  await writeFile(`${output}/${folder}${year}.json`,JSON.stringify(data)+'\n');
  audit.push({competition:gender,year,sources:options.map(o=>o.id),trainingYears:fitted.years,missingInputs:fitted.missingInputs,validationYears:report.folds.map(f=>f.year),sourceFit:options.filter(o=>o.fit).map(({id,fit})=>({id,...fit}))});
 }
}
await writeFile(`${output}/source-audit.json`,JSON.stringify(audit,null,2)+'\n');
console.log(`Generated ${audit.length} competition/seasons in ${output}`);
