import './style.css';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, AriaComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
echarts.use([LineChart, GridComponent, TooltipComponent, AriaComponent, SVGRenderer]);
import { echartsTheme } from './theme/echarts.js';
import { STAGES, probabilityLabel, exactProbability, probabilitiesFor, resultPath, teamHistory, bracketCandidates, sortTeams, snapshotDay, nearestSnapshot, snapshotStatus, unresolvedStages, lostAtStage, resultStatus } from './model.js';

const DATA_REVISION = '2026-10-09-bracket-labels';
const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const dateLabel = (value, year = false) => new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC' });
const narrow = matchMedia('(max-width: 680px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let catalog, data, selectedId, snapshotIndex = 0, mode = 'forecast', view = $('#explorer').clientWidth >= 1004 ? 'bracket' : 'table';
let explicitView = false, previewId, previewRound, slots = [];
let sort = { key: 'p6', direction: -1 }, timer, request = 0, chart, observer, pathMap;
const cache = new Map();
const currentP = id => pathMap.get(id);
const teamById = id => data.teams.find(team => team.id === id);
const provider = () => data.forecastProvider?.name ?? data.forecastProvider ?? 'FiveThirtyEight';
const reconstructed = () => data.forecasts?.[0]?.kind === 'reconstructed';
const gameDate = value => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
const snapshotName = () => `${dateLabel(data.forecasts[snapshotIndex].date, true)}${snapshotIndex === 0 ? ' · Initial forecast' : snapshotIndex === data.forecasts.length-1 ? ' · Last available' : ''}`;
const announce = message => { $('#announcement').textContent = message; };

async function loadYear(year) {
  const thisRequest = ++request;
  stopPlaying();
  disposeChart();
  $('#explorer').setAttribute('aria-busy', 'true');
  $('#workspace').hidden = true;
  $('#cancelled').hidden = true;
  $('#loading').hidden = false;
  $('#loading').textContent = `Loading the ${year} tournament…`;
  document.querySelectorAll('.toolbar button').forEach(button=>button.disabled=true);
  try {
    if (!cache.has(year)) {
      const entry = catalog.years.find(item => item.year === year);
      const response = await fetch(`${import.meta.env.BASE_URL}data/${entry.file ?? `${year}.json`}?v=${DATA_REVISION}`);
      if (!response.ok) throw new Error('Tournament file could not be loaded.');
      cache.set(year, await response.json());
    }
    if (thisRequest !== request) return;
    data = cache.get(year);
    snapshotIndex = 0;
    mode = data.forecasts?.length ? 'forecast' : 'results';
    selectedId = null;
    $('#loading').hidden = true;
    $('#year-coverage').textContent = data.status === 'cancelled' ? 'Cancelled · no tournament' : data.forecasts?.length ? reconstructed() ? 'Reconstructed forecast & results' : 'Archived forecasts & results' : 'Results · forecasts unavailable';
    $('#forecast-mode').disabled = !data.forecasts?.length;
    $('#results-mode').disabled = data.status === 'cancelled';
    $('#bracket-view').disabled = data.status === 'cancelled';
    $('#table-view').disabled = data.status === 'cancelled';
    renderSources();
    if (data.status === 'cancelled') {
      $('#cancelled').hidden = false;
      $('#explorer').setAttribute('aria-busy', 'false');
      announce(`${year}: tournament cancelled. No field or games.`);
      return;
    }
    refreshProbabilities();
    $('#team-select').innerHTML = '<option value="">Choose a team…</option>' + [...data.teams].sort((a,b) => a.name.localeCompare(b.name)).map(team => `<option value="${escape(team.id)}">${escape(team.name)} · ${team.seed} seed</option>`).join('');
    $('#workspace').hidden = false;
    render();
    $('#explorer').setAttribute('aria-busy', 'false');
    announce(`${year} loaded. ${data.teams.length} teams. ${mode === 'forecast' ? `${provider()} initial forecast.` : 'Actual results. Forecasts unavailable.'}`);
  } catch (error) {
    if (thisRequest !== request) return;
    $('#loading').textContent = `${error.message} Reload the page to try again.`;
    $('#explorer').setAttribute('aria-busy', 'false');
  }
}

function refreshProbabilities() {
  pathMap = new Map(data.teams.map(team => [team.id, mode === 'forecast' ? probabilitiesFor(data, snapshotIndex, team.id) : resultPath(data, team.id)]));
}

function stopPlaying() {
  clearInterval(timer);
  timer = null;
  $('#play').textContent = 'Play tournament';
}

function render() {
  refreshProbabilities();
  $('#forecast-mode').disabled = !data.forecasts?.length;
  $('#forecast-mode').setAttribute('aria-pressed', mode === 'forecast');
  $('#results-mode').setAttribute('aria-pressed', mode === 'results');
  $('#bracket-view').setAttribute('aria-pressed', view === 'bracket');
  $('#table-view').setAttribute('aria-pressed', view === 'table');
  $('#timeline').hidden = mode !== 'forecast';
  $('#results-heading').hidden = mode !== 'results';
  $('#coverage-note').hidden = !reconstructed() || mode !== 'forecast';
  if (mode === 'forecast') {
    const status = snapshotStatus(data, snapshotIndex);
    $('#snapshot-title').textContent = snapshotName();
    const firstDay = snapshotDay(data.forecasts[0].date);
    const finalDate = new Date(data.games.find(game=>game.round===6).date).toLocaleDateString('en-CA',{timeZone:'America/New_York'});
    const lastDay = Math.max(snapshotDay(data.forecasts.at(-1).date), snapshotDay(finalDate));
    const position = date => lastDay===firstDay ? 0 : (snapshotDay(date)-firstDay)/(lastDay-firstDay)*100;
    $('#snapshot').setAttribute('aria-valuemax', data.forecasts.length-1);
    $('#snapshot').setAttribute('aria-valuenow', snapshotIndex);
    $('#snapshot').setAttribute('aria-valuetext', `${snapshotName()}. ${status.label}`);
    $('#snapshot').setAttribute('aria-disabled', data.forecasts.length<2);
    $('#snapshot').innerHTML = `<span class="track-line"></span>${data.forecasts.map((snapshot,index)=>`<span class="date-tick ${index===snapshotIndex?'current':''}" data-snapshot="${index}" style="left:${position(snapshot.date)}%" title="${dateLabel(snapshot.date,true)}"><span>${snapshot.date.slice(8)}</span>${index===snapshotIndex?`<span class="current-round">${escape(status.roundLabel)}</span>`:''}</span>`).join('')}${snapshotDay(finalDate)>snapshotDay(data.forecasts.at(-1).date)?`<span class="date-tick unavailable" style="left:100%" title="${dateLabel(finalDate,true)} · Championship game · No archived forecast" aria-label="${dateLabel(finalDate,true)} championship game; forecast unavailable"><span>${finalDate.slice(8)}</span></span>`:''}`;
    $('#play').disabled = data.forecasts.length<2;
  } else {
    const champion = data.teams.find(team => currentP(team.id)?.[6] === 1);
    $('#results-heading').innerHTML = `<strong>${data.year} champion: ${escape(champion?.name ?? 'Not recorded')}.</strong> Every stage below represents a completed result. Scores and game details appear when you select a team.`;
  }
  $('#explore-help').textContent = view === 'bracket' ? 'Move over the bracket to preview. Click to pin; Escape clears. Arrow keys move between slots.' : mode === 'forecast' ? 'Sort a stage to compare chances. Select a team to inspect its forecast history below.' : 'Checkmarks show stages reached. Select a team for its games and scores.';
  $('#team-select').value = selectedId ?? '';
  updatePin();
  $('#bracket-panel').hidden = view !== 'bracket';
  $('#table-panel').hidden = view !== 'table';
  if (view === 'bracket') renderBracket();
  else renderTable();
  renderDetail();
}

// One fixed drawing keeps route widths, names and probabilities in the same scale.
const BRACKET_WIDTH = 1004, BRACKET_HEIGHT = 1024, FINAL_Y = 510;
const roundX = [6,138,210,282,354,426,502];
const leafY = slot => 56 + Math.floor(slot / 2) * 54 + slot % 2 * 18;
const roundY = (round, slot, lower) => (leafY(slot * 2 ** round) + leafY((slot + 1) * 2 ** round - 1)) / 2 + (lower ? 512 : 0);

function nodeMarkup(candidates, round, x, y, width, right, regionName) {
  const resolved = round===0 && candidates.length===1 ? candidates[0] : candidates.find(team=>currentP(team.id)?.[round]===1);
  const preferred = resolved ?? [...candidates].sort((a,b)=>(currentP(b.id)?.[round]??0)-(currentP(a.id)?.[round]??0))[0];
  const names = resolved ? round===0 ? resolved.bracketName : resolved.superShortName : round===0 ? candidates.map(team=>team.superShortName).join(' / ') : '';
  const label = `${STAGES[round]}${regionName?` · ${regionName}`:''}. ${resolved?resolved.name:`${round===0?`${candidates.map(team=>team.name).join(' or ')}. `:''}Most likely entrant: ${preferred?.name??'unknown'}`}${mode==='forecast'&&preferred?` · ${exactProbability(currentP(preferred.id)?.[round])}`:''}`;
  return `<button type="button" tabindex="-1" class="team-node ${right?'right':'left'} ${names?'':'empty'} ${round===0&&!resolved?'playin-slot':''} ${resolved&&lostAtStage(currentP(resolved.id),round)?'eliminated':''}" style="left:${x}px;top:${y}px;width:${width}px" data-x="${x+width/2}" data-y="${y}" data-candidates="${escape(candidates.map(team=>team.id).join(','))}" data-round="${round}" data-resolved="${escape(resolved?.id??'')}" data-team="${escape(preferred?.id??'')}" data-name="${escape(names)}" title="${escape(label)}" aria-label="${escape(label)}. Enter pins this team; arrow keys move between slots.">${round===0?`<span class="seed">${resolved?.seed??candidates[0]?.seed}</span>`:''}<span class="node-name">${escape(names)}</span></button>`;
}

function renderBracket() {
  let lines='', nodes='';
  const path = (ids,stage,x,fromY,endX,y) => `<path class="connector" data-path-ids="${escape(ids.join(','))}" data-stage="${stage}" data-route-key="${stage}:${endX}:${y}" data-label-x="${(x+endX)/2}" data-label-y="${y+(stage===5||fromY>y?25:-13)}" d="M ${x} ${fromY} V ${y} H ${endX}"/>`;
  data.regionOrder.forEach((name,index)=>{
    const right=index>1, lower=index%2, mirror=x=>right?BRACKET_WIDTH-x:x;
    for(let round=0;round<=4;round++) {
      for(let slot=0;slot<16/2**round;slot++) {
        const y=roundY(round,slot,lower), start=round===0?6:roundX[round]+4, end=roundX[round+1]-4;
        const candidates=bracketCandidates(data,name,round,slot);
        nodes+=nodeMarkup(candidates,round,right?mirror(end):start,y,end-start,right,name);
        if(round===0) lines+=`<path class="terminal-connector" d="M ${mirror(end)} ${y} H ${mirror(roundX[1])}"/>`;
        else for(let child=0;child<2;child++) lines+=path(bracketCandidates(data,name,round-1,slot*2+child).map(team=>team.id),round,mirror(roundX[round]),roundY(round-1,slot*2+child,lower),mirror(roundX[round+1]),y);
      }
    }
    lines+=path(data.teams.filter(team=>team.region===name).map(team=>team.id),5,mirror(roundX[5]),roundY(4,0,lower),mirror(roundX[6]),FINAL_Y);
  });
  data.finalFourPairs.forEach((pair,index)=>{
    const candidates=data.teams.filter(team=>pair.includes(team.region));
    nodes+=nodeMarkup(candidates,5,index===0?430:506,FINAL_Y,68,index===1);
    lines+=`<path class="connector title-stem" data-path-ids="${escape(candidates.map(team=>team.id).join(','))}" data-stage="6" data-route-key="title" d="M 502 ${FINAL_Y} V ${FINAL_Y-45}"/>`;
  });
  nodes+=nodeMarkup(data.teams,6,466,FINAL_Y-45,72,false);
  const headings=['Round of 64','Round of 32','Sweet 16','Elite Eight','Final Four','Championship','Final Four','Elite Eight','Sweet 16','Round of 32','Round of 64'];
  const columns=[70,174,246,318,390,502,614,686,758,830,934];
  const status=mode==='forecast'?snapshotStatus(data,snapshotIndex).label:'Completed tournament results';
  $('#bracket-panel').innerHTML=`<p class="bracket-scroll-hint">Scroll to see the full bracket, or choose Table.</p><div class="bracket-scroll"><div class="bracket-map"><div class="round-labels">${headings.map((label,index)=>`<span style="left:${columns[index]}px">${label}</span>`).join('')}</div><div class="bracket-tree"><svg class="connectors" viewBox="0 0 ${BRACKET_WIDTH} ${BRACKET_HEIGHT}" aria-hidden="true"><g class="bracket-backbone">${lines}</g><g class="active-route"></g><g class="route-probabilities"></g></svg>${data.regionOrder.map((name,index)=>`<h3 class="region-name ${index>1?'right':''}" style="top:${index%2?520:8}px">${escape(name)}</h3>`).join('')}${nodes}<p class="bracket-status">Men’s · ${data.year}<br><span>${escape(status)}</span>${mode==='forecast'&&reconstructed()?'<br><strong>Reconstructed model</strong>':''}</p><div class="title-forecast"><p id="title-team"></p><div class="title-probability"></div><p class="center-note"></p></div></div></div></div>${firstFourMarkup()}`;
  slots=[...$('#bracket-panel').querySelectorAll('.team-node')].map(element=>({element,x:Number(element.dataset.x),y:Number(element.dataset.y),round:Number(element.dataset.round),id:element.dataset.team}));
  slots[0].element.tabIndex=0;
  previewId=undefined;
  previewRound=undefined;
  decorateRoute(selectedId);
}

function firstFourMarkup() {
  const games = data.games.filter(game=>game.round===0);
  if (!games.length) return '';
  return `<section class="first-four" aria-label="First Four games"><h3>First Four</h3><div class="play-in-games">${games.map(game=>`<div class="play-in"><p>${escape(game.region)} · A place in the 64</p>${game.teamIds.map((id,index)=>{ const team=teamById(id); return `<button type="button" data-team="${escape(id)}" aria-pressed="${id===selectedId}">${escape(team?.name)}<span>${mode==='forecast'?probabilityLabel(currentP(id)?.[0]):escape(game.scores[index]??'—')}</span></button>`; }).join('')}</div>`).join('')}</div></section>`;
}

function decorateRoute(id, round) {
  if(id===previewId && round===previewRound) return;
  const changedTeam=id!==previewId;
  previewId=id;
  previewRound=round;
  const team=teamById(id), probabilities=team?currentP(id):[];
  if(changedTeam) {
    const activeKeys=new Set(), routes=[], labels=[], unresolved=new Set(unresolvedStages(probabilities));
    const lines=[...$('#bracket-panel').querySelectorAll('.bracket-backbone .connector')];
    for(const line of lines) {
      line.dataset.originalPath??=line.getAttribute('d');
      const stage=Number(line.dataset.stage), p=probabilities[stage]??0;
      if(!line.dataset.pathIds.split(',').includes(id) || !unresolved.has(stage)) continue;
      activeKeys.add(line.dataset.routeKey);
      routes.push(`<path class="connector route" data-stage="${stage}" pathLength="1" d="${line.dataset.originalPath}" style="stroke-width:${.5+15*Math.sqrt(p)}"/>`);
      if(stage<6 && mode==='forecast') labels.push(`<text data-stage="${stage}" x="${line.dataset.labelX}" y="${line.dataset.labelY}" text-anchor="middle">${probabilityLabel(p)}</text>`);
    }
    for(const line of lines) {
      const stage=Number(line.dataset.stage);
      const active=line.dataset.pathIds.split(',').includes(id)&&unresolved.has(stage);
      line.style.display=active||line.dataset.routeKey==='title'&&activeKeys.has('title')?'none':'';
      line.setAttribute('d',activeKeys.has(line.dataset.routeKey)?line.dataset.originalPath.split(' H ')[0]:line.dataset.originalPath);
    }
    const routeGroup=$('.active-route');
    routeGroup.querySelectorAll('.retiring').forEach(path=>path.remove());
    routeGroup.querySelectorAll('path').forEach(path=>{
      if(reducedMotion.matches) { path.remove(); return; }
      path.getAnimations().forEach(animation=>animation.cancel());
      path.classList.add('retiring');
      path.animate([{strokeWidth:path.style.strokeWidth},{strokeWidth:0}],{duration:50+Number(path.dataset.stage)*100,fill:'forwards'}).finished.then(()=>path.remove()).catch(()=>{});
    });
    routeGroup.insertAdjacentHTML('beforeend',routes.join(''));
    if(!reducedMotion.matches) routeGroup.querySelectorAll('path:not(.retiring)').forEach(path=>{
      const stage=Number(path.dataset.stage);
      path.animate([{strokeDasharray:'1',strokeDashoffset:1,strokeWidth:0},{strokeDasharray:'1',strokeDashoffset:0,strokeWidth:path.style.strokeWidth}],{duration:50+stage*100,delay:(stage-1)*45,fill:'backwards'});
    });
    $('.route-probabilities').innerHTML=labels.join('');
    $('#title-team').textContent=team?.name??'';
    $('.title-probability').textContent=!team?'':mode==='results'?probabilities[6]===1?'Winner':'':probabilities[6]===1?'100%':probabilities[6]===0?'0%':probabilityLabel(probabilities[6]);
    $('.title-probability').title=team&&mode==='forecast'?exactProbability(probabilities[6]):'';
    $('.center-note').textContent=!team?mode==='forecast'?'Hover over each slot to see the team most likely to get there.':'Hover over each slot to see the team that reached it.':mode==='results'?probabilities[6]===1?'':resultStatus(probabilities):'Chance of winning the tournament';
    $('.title-forecast').classList.toggle('unselected',!team);
    for(const {element:node} of slots) {
      const stage=Number(node.dataset.round), resolved=node.dataset.resolved;
      const inPath=Boolean(team&&node.dataset.candidates.split(',').includes(id)&&probabilities[stage]>0);
      node.classList.toggle('selected',inPath&&(stage===0||resolved===id));
      node.querySelector('.node-name').textContent=node.classList.contains('playin-slot')&&inPath?team.bracketName:node.dataset.name;
      node.setAttribute('aria-pressed',node.dataset.team===selectedId&&inPath);
    }
  }
  $('.route-probabilities').querySelectorAll('text').forEach(label=>label.classList.toggle('selected-percentage',Number(label.dataset.stage)===round));
}

function renderTable() {
  const stages=STAGES.map((label,index)=>({key:`p${index}`,label:index===6?'Win title':label}));
  const allFirstRoundKnown=data.teams.every(team=>[0,1].includes(currentP(team.id)?.[0]));
  const columns=narrow.matches?[{key:'name',label:'Team'},stages[6],...stages.slice(allFirstRoundKnown?1:0,6)]:[{key:'name',label:'Team'},{key:'region',label:'Region'},{key:'seed',label:'Seed'},...stages];
  const teams=sortTeams(data.teams,{teams:data.teams.map(team=>({id:team.id,p:currentP(team.id)}))},sort);
  const probabilityCell=p=>{
    const channels=[255-254*(p??0),255-222*(p??0),255-150*(p??0)].map(Math.round);
    const luminance=channels.map(channel=>channel/255).map(channel=>channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4).reduce((sum,channel,index)=>sum+channel*[.2126,.7152,.0722][index],0);
    const color=1.05/(luminance+.05)>=4.5?'white':'black';
    return `<td style="background:rgb(${channels.join(',')});color:${color}" title="${escape(exactProbability(p))}"><span aria-label="${escape(mode==='forecast'?p===1?'Already reached':p===0?'Zero chance':exactProbability(p):p===1?'Reached':'Did not reach')}">${probabilityLabel(p)}</span></td>`;
  };
  $('#table-panel').innerHTML=`<div class="table-scroll" tabindex="0" aria-label="${mode==='forecast'?'Forecast probability':'Stages reached'} table; scroll for all columns"><table class="odds-table"><caption>${mode==='forecast'?`${escape(provider())} · ${escape(snapshotName())} · Chance of reaching each stage`:`${data.year} results · Stages actually reached`}. Select a heading to sort.</caption><thead><tr>${columns.map(column=>`<th scope="col" ${column.key==='name'?'class="team-column"':''} aria-sort="${sort.key===column.key?(sort.direction===1?'ascending':'descending'):'none'}"><button type="button" data-sort="${column.key}">${column.label}</button></th>`).join('')}</tr></thead><tbody>${teams.map(team=>`<tr class="${team.id===selectedId?'selected':''}">${columns.map(column=>column.key==='name'?`<th scope="row" class="team-column"><button type="button" data-team="${escape(team.id)}" aria-pressed="${team.id===selectedId}">${narrow.matches?`<span class="table-seed">${team.seed}</span> ${escape(team.bracketName)}`:escape(team.name)}</button></th>`:column.key==='region'?`<td>${escape(team.region)}</td>`:column.key==='seed'?`<td>${team.seed}</td>`:probabilityCell(currentP(team.id)?.[Number(column.key.slice(1))])).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function updatePin() {
  $('#clear-pin').hidden=!selectedId;
  $('#clear-pin').textContent=selectedId?`Pinned: ${teamById(selectedId).name} ×`:'';
  $('#bracket-panel').querySelectorAll('.play-in button').forEach(button=>button.setAttribute('aria-pressed',button.dataset.team===selectedId));
}

function clearPin() {
  selectedId=null;
  $('#team-select').value='';
  updatePin();
  if(view==='bracket') decorateRoute(null);
  else renderTable();
  renderDetail();
  announce('Team unpinned. The bracket is clear.');
}

function selectTeam(id) {
  if (!teamById(id)) return;
  selectedId = id;
  $('#team-select').value = id;
  updatePin();
  if (view==='bracket') {
    decorateRoute(id, previewRound);
    slots.forEach(({element:node})=>node.setAttribute('aria-pressed',node.dataset.team===selectedId&&node.classList.contains('selected')));
    if(narrow.matches) { const terminal=[...$('#bracket-panel').querySelectorAll('.team-node[data-round="0"]')].find(node=>node.dataset.candidates.split(',').includes(id)); if(terminal) $('.bracket-scroll').scrollLeft=terminal.offsetLeft-16; }
  } else {
    $('#table-panel').querySelectorAll('tbody tr').forEach(row=>{const button=row.querySelector('[data-team]');row.classList.toggle('selected',button.dataset.team===id);button.setAttribute('aria-pressed',button.dataset.team===id);});
  }
  renderDetail();
  announce(`${teamById(id).name} selected. ${mode==='forecast'?`${exactProbability(currentP(id)?.[6])} championship chance.`:'Game results shown below.'}`);
}

function disposeChart() { observer?.disconnect(); observer=null; chart?.dispose(); chart=null; }

function renderDetail() {
  disposeChart();
  const team=teamById(selectedId), p=currentP(selectedId);
  $('#team-detail').hidden=!team;
  if (!team) { $('#team-detail').innerHTML=''; return; }
  const stages = `<dl class="stage-strip">${STAGES.map((label,index)=>`<div><dt>${label}</dt><dd title="${escape(exactProbability(p?.[index]))}" aria-label="${escape(mode==='forecast'?exactProbability(p?.[index]):p?.[index]===1?'Reached':'Did not reach')}">${probabilityLabel(p?.[index])}</dd></div>`).join('')}</dl>`;
  const eliminated = p?.[6]===0;
  const copy = mode==='forecast' ? eliminated ? `${team.name} had no remaining path to the title in this snapshot.` : p?.[6]===1 ? `${team.name} had secured the championship in this snapshot.` : `A ${exactProbability(p?.[6])} championship chance still leaves ${exactProbability(1-p[6])} for someone else. Even a favorite has to survive an entire bracket.` : `${team.name} ${p?.[6]===1?'won the championship':`reached ${STAGES[p.lastIndexOf(1)] ?? 'the First Four'}`}. These are completed results, not model probabilities.`;
  $('#team-detail').innerHTML = `<div><p class="eyebrow">Pinned team · select a team to change</p><h2 id="team-title">${escape(team.name)}</h2><p class="team-meta">No. ${team.seed} seed · ${escape(team.region)} · ${data.year}</p><p class="team-summary">${escape(copy)}</p>${mode==='forecast'?`<p class="big-probability">${exactProbability(p?.[6])}</p><p class="eyebrow">Chance of winning the title</p>`:''}${stages}</div><div class="history">${mode==='forecast'?historyMarkup():gamesMarkup()}</div>`;
  if (mode==='forecast') renderChart();
}

function historyMarkup() {
  const history=teamHistory(data,selectedId).slice(0,snapshotIndex+1);
  return `<div class="history-heading"><h3>The forecast, in motion.</h3><span>Title chance · %</span></div><div id="history-chart" role="img" aria-label="${escape(teamById(selectedId).name)} championship probability through the selected snapshot. Readable percentages in the table below; full precision in the data download."></div><p class="chart-note">${history.length===1?data.forecasts.length === 1 ? 'One reconstructed pre-tournament snapshot is available. There is no historical replay for this model.' : 'Only the initial snapshot is shown. Move along the date track to reveal what happened next.':'The line ends at the selected snapshot. Spacing follows elapsed days; recorded dates are not precise tip-off timestamps.'}</p><details class="history-details"><summary>Read forecast history as a table</summary><div class="table-scroll" tabindex="0"><table><thead><tr><th scope="col">Snapshot</th><th scope="col">Title chance</th></tr></thead><tbody>${history.map(point=>`<tr><th scope="row">${dateLabel(point.date,true)}</th><td>${exactProbability(point.p?.[6])}</td></tr>`).join('')}</tbody></table></div></details>`;
}

function renderChart() {
  const element=$('#history-chart');
  const history=teamHistory(data,selectedId).slice(0,snapshotIndex+1);
  chart=echarts.init(element,echartsTheme(),{renderer:'svg'});
  chart.setOption({
    animation:false, useUTC:true, aria:{enabled:true}, grid:{left:44,right:20,top:20,bottom:36},
    tooltip:{trigger:'axis',renderMode:'richText',valueFormatter:value=>exactProbability(Number(Array.isArray(value)?value[1]:value)/100)},
    xAxis:{
      ...(history.length===1 ? {type:'category',data:[dateLabel(history[0].date)],boundaryGap:true} : {type:'time',min:Date.parse(history[0].date),max:Date.parse(history.at(-1).date),minInterval:86400000,splitNumber:6}),
      axisTick:{show:false},axisLine:{lineStyle:{color:'#666666'}},
      axisLabel:{fontSize:11,hideOverlap:true,...(history.length>1?{formatter:value=>dateLabel(new Date(value).toISOString())}:{})}
    },
    yAxis:{type:'value',min:0,max:Math.max(10,Math.ceil(Math.max(...history.map(point=>(point.p?.[6]??0)*100))/10)*10),axisLabel:{formatter:'{value}%',fontSize:10},splitLine:{lineStyle:{color:'#E5E5E5'}}},
    series:[{type:'line',data:history.map(point=>history.length===1?(point.p?.[6]??0)*100:[Date.parse(point.date),(point.p?.[6]??0)*100]),symbol:'circle',symbolSize:7,lineStyle:{width:3,color:'#012169'},itemStyle:{color:'#012169'},emphasis:{disabled:true}}]
  });
  observer=new ResizeObserver(()=>chart?.resize());
  observer.observe(element);
}

function gamesMarkup() {
  const games=data.games.filter(game=>game.teamIds.includes(selectedId)).sort((a,b)=>a.round-b.round);
  return `<h3>The games behind the result.</h3><ul class="game-list">${games.map(game=>{const index=game.teamIds.indexOf(selectedId),opponent=teamById(game.teamIds[1-index]);return `<li><small>${escape(game.roundName??(game.round===0?'First Four':STAGES[game.round-1]))}<br>${gameDate(game.date)}</small><span>vs. ${escape(opponent?.name??'Unknown')}<br><small>${game.status==='no-contest'?(game.winnerId===selectedId?'No contest · advanced by rule':'No contest · did not advance'):game.winnerId===selectedId?'Won':'Lost'}</small></span><strong>${game.status==='no-contest'?'No score':`${game.scores[index]}–${game.scores[1-index]}`}</strong></li>`;}).join('')}</ul>`;
}

function renderSources() {
  const forecasts=data.forecasts?.length??0;
  $('#about-coverage').textContent=data.status==='cancelled'?'2020 has no bracket because the tournament was cancelled.':forecasts?reconstructed() ? `${data.year} uses one reconstructed forecast from pre-tournament T-Rank ratings and a neutral-court log5 win-probability model. It is not a published FiveThirtyEight or T-Rank tournament forecast. Actual results are shown separately.` : `${data.year} includes ${forecasts} archived ${provider()} snapshots, from ${dateLabel(data.forecasts[0].date)} through ${dateLabel(data.forecasts.at(-1).date)}. The last available forecast may precede the championship game. Actual results are shown separately.`:`${data.year} includes the actual bracket and results. Archived FiveThirtyEight forecasts are unavailable, so there is no probability timeline for this year.`;
  const sources=(data.sources??[]).map(source=>typeof source==='string'?{url:source,label:source}:source);
  $('#source-list').innerHTML=`<p>Selected year: ${data.year}. ${forecasts?reconstructed() ? 'One reconstructed pre-tournament forecast.' : `${forecasts} genuine archived forecasts.`:data.status==='cancelled'?'Tournament cancelled.':'Results only; no replacement forecasts.'}</p>${data.modelNote?`<p>${escape(data.modelNote)}</p>`:''}${data.forecastNote?`<p>${escape(data.forecastNote)}</p>`:''}<ul>${sources.map(source=>`<li>${source.url?`<a href="${escape(source.url)}" target="_blank" rel="noreferrer">${escape(source.label??source.name??source.title??source.provider??source.url)}</a>`:escape(source.label??source.name??source.title??'Source')}${source.license?` · ${escape(source.license)}`:''}${source.methodUrl?` · <a href="${escape(source.methodUrl)}" target="_blank" rel="noreferrer">Rating method</a>`:''}${source.bulkDataGuideUrl?` · <a href="${escape(source.bulkDataGuideUrl)}" target="_blank" rel="noreferrer">Source data guide</a>`:''}</li>`).join('')}</ul><p><a href="${import.meta.env.BASE_URL}data/${data.year}.json" download="tournament-${data.year}.json">Download this year’s bundled data</a></p>${data.corrections?.length?`<details><summary>Data reconciliation notes (${data.corrections.length})</summary><ul>${data.corrections.map(note=>`<li>${escape(typeof note==='string'?note:note.reason??JSON.stringify(note))}</li>`).join('')}</ul></details>`:''}`;
}

$('#year').addEventListener('change',event=>loadYear(Number(event.target.value)));
$('#forecast-mode').addEventListener('click',()=>{stopPlaying();mode='forecast';render();announce(reconstructed()?'Reconstructed pre-tournament forecast shown.':'Archived forecasts shown.');});
$('#results-mode').addEventListener('click',()=>{stopPlaying();mode='results';render();announce('Actual tournament results shown.');});
$('#bracket-view').addEventListener('click',()=>{explicitView=true;view='bracket';render();});
$('#table-view').addEventListener('click',()=>{explicitView=true;view='table';render();});
$('#team-select').addEventListener('change',event=>event.target.value?selectTeam(event.target.value):clearPin());
$('#clear-pin').addEventListener('click',clearPin);
function chooseSnapshot(index) { stopPlaying(); snapshotIndex=index; render(); }
$('#snapshot').addEventListener('click',event=>{
  if(data.forecasts.length<2||event.target.closest('.unavailable')) return;
  const tick=event.target.closest('[data-snapshot]');
  const firstDay=snapshotDay(data.forecasts[0].date), finalDate=new Date(data.games.find(game=>game.round===6).date).toLocaleDateString('en-CA',{timeZone:'America/New_York'});
  const lastDay=Math.max(snapshotDay(data.forecasts.at(-1).date),snapshotDay(finalDate));
  const bounds=event.currentTarget.getBoundingClientRect();
  chooseSnapshot(tick?Number(tick.dataset.snapshot):nearestSnapshot(data.forecasts,firstDay+(event.clientX-bounds.left)/bounds.width*(lastDay-firstDay)));
  $('#snapshot').focus();
  announce(snapshotName());
});
$('#snapshot').addEventListener('keydown',event=>{
  const direction={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1}[event.key];
  if(direction||event.key==='Home'||event.key==='End') {
    event.preventDefault();
    chooseSnapshot(event.key==='Home'?0:event.key==='End'?data.forecasts.length-1:Math.max(0,Math.min(data.forecasts.length-1,snapshotIndex+direction)));
    announce(snapshotName());
  }
});
$('#play').addEventListener('click',()=>{
  if(timer){stopPlaying();return;}
  if(snapshotIndex===data.forecasts.length-1){snapshotIndex=0;render();}
  $('#play').textContent='Pause tournament';
  if(view==='bracket')decorateRoute(selectedId);
  timer=setInterval(()=>{snapshotIndex++;render();if(snapshotIndex>=data.forecasts.length-1){stopPlaying();announce('Reached the last available forecast.');}},500);
});
const nearestSlot=event=>{
  const bounds=$('.bracket-tree').getBoundingClientRect(), x=event.clientX-bounds.left, y=event.clientY-bounds.top;
  return slots.reduce((nearest,slot)=>(slot.x-x)**2+(slot.y-y)**2<(nearest.x-x)**2+(nearest.y-y)**2?slot:nearest);
};
$('#bracket-panel').addEventListener('pointermove',event=>{
  if(timer) return;
  if(event.target.closest('.bracket-tree')) { const slot=nearestSlot(event); decorateRoute(slot.id,slot.round); }
  else if(event.target.closest('.play-in [data-team]')) decorateRoute(event.target.closest('[data-team]').dataset.team,0);
  else decorateRoute(selectedId);
});
$('#bracket-panel').addEventListener('click',event=>{
  if(event.target.closest('.bracket-tree')) {
    const slot=event.detail===0?slots.find(slot=>slot.element===event.target.closest('.team-node')):nearestSlot(event);
    if(slot) selectTeam(slot.id);
  } else { const button=event.target.closest('[data-team]'); if(button) selectTeam(button.dataset.team); }
});
$('#bracket-panel').addEventListener('pointerleave',()=>{if(!timer)decorateRoute(selectedId);});
$('#bracket-panel').addEventListener('focusin',event=>{
  const button=event.target.closest('[data-team]');
  if(button) {
    if(button.classList.contains('team-node')) slots.forEach(({element})=>element.tabIndex=element===button?0:-1);
    if(!timer)decorateRoute(button.dataset.team,Number(button.dataset.round??0));
  }
});
$('#bracket-panel').addEventListener('focusout',event=>{if(!$('#bracket-panel').contains(event.relatedTarget))decorateRoute(selectedId);});
$('#bracket-panel').addEventListener('keydown',event=>{
  const current=slots.find(slot=>slot.element===event.target);
  if(!current||!event.key.startsWith('Arrow')) return;
  event.preventDefault();
  let candidates;
  if(event.key==='ArrowUp'||event.key==='ArrowDown') {
    const direction=event.key==='ArrowDown'?1:-1;
    candidates=slots.filter(slot=>slot.round===current.round&&(slot.x<502)===(current.x<502)&&(slot.y-current.y)*direction>0);
  } else {
    const direction=event.key==='ArrowRight'?1:-1;
    const nextRound=current.round+(direction===(current.x<502?1:-1)?1:-1);
    candidates=current.round===6?slots.filter(slot=>slot.round===5&&(slot.x-502)*direction>0):slots.filter(slot=>slot.round===nextRound&&(slot.x<502)===(current.x<502));
    if(nextRound===6) candidates=slots.filter(slot=>slot.round===6);
  }
  const next=candidates.sort((a,b)=>Math.abs(a.y-current.y)-Math.abs(b.y-current.y))[0];
  next?.element.focus();
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&data?.status==='played'){stopPlaying();clearPin();}});
let previousNarrow=narrow.matches;
new ResizeObserver(()=>{
  if(!data||data.status!=='played')return;
  const nextView=$('#explorer').clientWidth>=BRACKET_WIDTH?'bracket':'table';
  if(!explicitView&&view!==nextView){view=nextView;render();}
  else if(view==='table'&&previousNarrow!==narrow.matches)renderTable();
  previousNarrow=narrow.matches;
}).observe($('#explorer'));
$('#table-panel').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.team)selectTeam(button.dataset.team);
  if(button.dataset.sort){sort={key:button.dataset.sort,direction:sort.key===button.dataset.sort?-sort.direction:button.dataset.sort.startsWith('p')?-1:1};renderTable();$(`[data-sort="${sort.key}"]`).focus();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlaying();});
window.addEventListener('pagehide',()=>{stopPlaying();disposeChart();});
window.addEventListener('pageshow',event=>{if(event.persisted && data?.status==='played' && !$('#workspace').hidden){renderDetail();if(view==='bracket')renderBracket();}});

await document.fonts.ready;
try {
  const response=await fetch(`${import.meta.env.BASE_URL}data/index.json?v=${DATA_REVISION}`);
  if(!response.ok)throw new Error('Could not load the tournament index.');
  catalog=await response.json();
  $('#year').innerHTML=catalog.years.map(entry=>`<option value="${entry.year}">${entry.year}${entry.status==='cancelled'?' · Cancelled':''}</option>`).join('');
  $('#year').disabled=false;
  $('#year').value='2023';
  await loadYear(2023);
} catch(error) { $('#loading').textContent=`${error.message} Reload to try again.`; $('#explorer').setAttribute('aria-busy','false'); }
