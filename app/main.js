import './style.css';
import { narrowNames } from './names.js';
import { STAGES, probabilityLabel, exactProbability, probabilitiesFor, resultPath, bracketCandidates, sortTeams, snapshotDay, nearestSnapshot, snapshotStatus, unresolvedStages, lostAtStage, resultStatus } from './model.js';

const DATA_REVISION = '2026-10-10-source-blends';
const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const dateLabel = (value, year = false) => new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC' });
const narrow = matchMedia('(max-width: 680px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let catalog, data, gender = 'mens', snapshotIndex = 0, mode = 'forecast', view = $('#explorer').clientWidth >= 1004 ? 'bracket' : 'table';
let explicitView = false, previewId, previewRound, slots = [];
let sort = { key: 'p6', direction: -1 }, timer, request = 0, pathMap;
const cache = new Map();
// A year without the chosen source falls back without changing the visitor's choice.
let sourceId = 'fivethirtyeight', preferredSource = sourceId;
const activeSource = () => data.forecastOptions?.find(option => option.id === sourceId);
const competitionName = () => gender === 'womens' ? 'Women’s' : 'Men’s';
const currentP = id => pathMap.get(id);
const teamById = id => data.teams.find(team => team.id === id);
const isEliminated = id => mode==='results' ? currentP(id)[6]===0 : data.forecasts[snapshotIndex].teams.find(team=>team.id===id).alive===false;
const provider = () => data.forecastProvider?.name ?? data.forecastProvider ?? 'FiveThirtyEight';
const reconstructed = () => data.forecasts?.[0]?.kind === 'reconstructed';
const snapshotName = () => `${dateLabel(data.forecasts[snapshotIndex].date, true)}${snapshotIndex === 0 ? ' · Initial forecast' : snapshotIndex === data.forecasts.length-1 ? ' · Last available' : ''}`;
const percent = p => p === 0 ? '0%' : p === 1 ? '100%' : probabilityLabel(p);
const nameMeasure = document.createElement('canvas').getContext('2d');
nameMeasure.font = '600 12px "Open Sans"';
const displayName = (team, width) => nameMeasure.measureText(team.bracketName).width <= width ? team.bracketName : narrowNames[team.bracketName] ?? team.bracketName;
const scoreLabel = game => game.status === 'no-contest' ? 'Advanced by rule' : [game.scores[game.teamIds.indexOf(game.winnerId)], game.scores[1-game.teamIds.indexOf(game.winnerId)]].join('–');
const announce = message => { $('#announcement').textContent = message; };

async function loadYear(year, competition = gender) {
  gender = competition;
  const entry = catalog.competitions[competition].years.find(item => item.year === year);
  const key = `${competition}/${year}`;
  for (const name of ['mens','womens']) {
    $(`#${name}`).disabled = false;
    $(`#${name}`).setAttribute('aria-pressed', name === competition);
  }
  const thisRequest = ++request;
  stopPlaying();
  $('#explorer').setAttribute('aria-busy', 'true');
  $('#source').disabled = true;
  $('#workspace').hidden = true;
  $('#cancelled').hidden = true;
  $('#loading').hidden = false;
  $('#loading').textContent = `Loading the ${year} ${competitionName()} tournament…`;
  document.querySelectorAll('#forecast-mode,#results-mode,#bracket-view,#table-view').forEach(button=>button.disabled=true);
  try {
    if (!cache.has(key)) {
      const response = await fetch(`${import.meta.env.BASE_URL}data/${entry.file}?v=${DATA_REVISION}`);
      if (!response.ok) throw new Error('Tournament file could not be loaded.');
      cache.set(key, await response.json());
    }
    if (thisRequest !== request) return;
    data = {...cache.get(key)};
    const options = data.forecastOptions ?? [];
    $('#source').innerHTML = options.length ? options.map(option => `<option value="${escape(option.id)}">${escape(option.name)}</option>`).join('') : '<option>No forecasts</option>';
    $('#source').disabled = !options.length;
    if(options.length) applySource(options.some(option => option.id === preferredSource) ? preferredSource : options[0].id);
    snapshotIndex = 0;
    mode = data.forecasts?.length ? 'forecast' : 'results';
    $('#loading').hidden = true;
    $('#year-coverage').textContent = data.status === 'cancelled' ? 'Cancelled · no tournament' : data.forecasts?.length ? reconstructed() ? 'Reconstructed forecast & results' : 'Archived forecasts & results' : 'Results · forecasts unavailable';
    $('#forecast-mode').disabled = !data.forecasts?.length;
    $('#results-mode').disabled = data.status === 'cancelled';
    $('#bracket-view').disabled = data.status === 'cancelled';
    $('#table-view').disabled = data.status === 'cancelled';
    $('#cancelled a').href = `https://www.ncaa.com/history/basketball-${competition === 'womens' ? 'women' : 'men'}/d1`;
    updateAboutLinks();
    if (data.status === 'cancelled') {
      renderHeading();
      $('#coverage-note').hidden = false;
      $('#coverage-note').textContent = $('#year-coverage').textContent;
      $('#cancelled').hidden = false;
      $('#explorer').setAttribute('aria-busy', 'false');
      announce(`${year}: tournament cancelled. No field or games.`);
      return;
    }
    refreshProbabilities();
    $('#workspace').hidden = false;
    render();
    $('#explorer').setAttribute('aria-busy', 'false');
    announce(`${competitionName()} ${year} loaded. ${data.teams.length} teams. ${mode === 'forecast' ? `${provider()} initial forecast.` : 'Actual results. Forecasts unavailable.'}`);
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
  $('#play').innerHTML = '▶ <span>Play</span>';
  $('#play').setAttribute('aria-label', 'Play tournament');
}

function snapshotRange() {
  const finalDate = new Date(data.games.find(game=>game.round===6).date).toLocaleDateString('en-CA',{timeZone:'America/New_York'});
  // Include the full first and final calendar days, not just their centers.
  return { finalDate, start: snapshotDay(data.forecasts[0].date)-.5, end: Math.max(snapshotDay(data.forecasts.at(-1).date),snapshotDay(finalDate))+.5 };
}

// The heading names what the controls currently show.
function renderHeading() {
  $('#explorer-kicker').textContent = `${competitionName()} tournament`;
  $('#explorer-title').textContent = `${data.year} ${data.status === 'cancelled' ? 'tournament' : mode === 'forecast' ? 'forecasts' : 'results'}`;
}

function render() {
  refreshProbabilities();
  renderHeading();
  $('#forecast-mode').disabled = !data.forecasts?.length;
  $('#forecast-mode').setAttribute('aria-pressed', mode === 'forecast');
  $('#results-mode').setAttribute('aria-pressed', mode === 'results');
  $('#bracket-view').setAttribute('aria-pressed', view === 'bracket');
  $('#table-view').setAttribute('aria-pressed', view === 'table');
  $('#timeline').hidden = mode !== 'forecast' || data.forecasts.length === 1;
  $('#single-snapshot').hidden = mode !== 'forecast' || data.forecasts.length !== 1;
  if (data.forecasts.length === 1) $('#single-snapshot').textContent = `${dateLabel(data.forecasts[0].date, true)} · ${provider()}`;
  $('#results-heading').hidden = mode !== 'results';
  $('#coverage-note').hidden = data.forecasts.length > 0 && mode !== 'forecast';
  $('#coverage-note').textContent = data.forecasts.length ? `${provider()} · ${reconstructed() ? 'Based on pre-tournament forecasts; recalculated after completed games.' : 'Published historical forecasts.'}` : 'Results only · No verified pre-tournament forecast is bundled for this year.';
  if (mode === 'forecast') {
    const status = snapshotStatus(data, snapshotIndex);
    $('#snapshot-title').textContent = snapshotName();
    const { finalDate, start: firstDay, end: lastDay } = snapshotRange();
    const position = date => (snapshotDay(date)-firstDay)/(lastDay-firstDay)*100;
    $('#snapshot').setAttribute('aria-valuemax', data.forecasts.length-1);
    $('#snapshot').setAttribute('aria-valuenow', snapshotIndex);
    $('#snapshot').setAttribute('aria-valuetext', `${snapshotName()}. ${status.label}`);
    $('#snapshot').setAttribute('aria-disabled', data.forecasts.length<2);
    const bands = ['First Four','Round of 64','Round of 32','Sweet 16','Elite Eight','Final Four','Final'].map((label, round) => {
      const days=data.games.filter(game=>game.round === round).map(game=>snapshotDay(new Date(game.date).toLocaleDateString('en-CA',{timeZone:'America/New_York'})));
      if(!days.length) return '';
      const start=Math.max(firstDay,Math.min(...days)-.5), end=Math.min(lastDay,Math.max(...days)+.5);
      return `<span class="round-band" style="left:${(start-firstDay)/(lastDay-firstDay)*100}%;width:${(end-start)/(lastDay-firstDay)*100}%" title="${label}"><span>${label}</span></span>`;
    }).join('');
    $('#snapshot').innerHTML = `${bands}<span class="track-line"></span>${data.forecasts.map((snapshot,index)=>{
      const monthStart=index===0 || snapshot.date.slice(0,7)!==data.forecasts[index-1].date.slice(0,7);
      return `<span class="date-tick ${index===snapshotIndex?'current':''} ${index===0?'first':''} ${index===data.forecasts.length-1?'last':''}" data-snapshot="${index}" style="left:${position(snapshot.date)}%" title="${dateLabel(snapshot.date,true)}"><span class="tick-label">${monthStart?dateLabel(snapshot.date):Number(snapshot.date.slice(8,10))}</span></span>`;
    }).join('')}${snapshotDay(finalDate)>snapshotDay(data.forecasts.at(-1).date)?`<span class="date-tick unavailable" style="left:${position(finalDate)}%" title="${dateLabel(finalDate,true)} · Championship game · No archived forecast" aria-label="${dateLabel(finalDate,true)} championship game; forecast unavailable"><span class="tick-label">${dateLabel(finalDate)}</span></span>`:''}`;
    $('#play').disabled = data.forecasts.length<2;
  } else {
    const champion = data.teams.find(team => currentP(team.id)?.[6] === 1);
    $('#results-heading').innerHTML = `<strong>${data.year} champion: ${escape(champion?.name ?? 'Not recorded')}.</strong> Every stage below represents a completed result.`;
  }
  $('#bracket-panel').hidden = view !== 'bracket';
  $('#table-panel').hidden = view !== 'table';
  if (view === 'bracket') renderBracket();
  else renderTable();
  $('#first-four-panel').innerHTML = view==='bracket' ? firstFourMarkup() : '';
}

// Expand round spacing without scaling text, route widths or vertical geometry.
const BRACKET_WIDTH = 1004, BRACKET_HEIGHT = 1024, FINAL_Y = 510;
let bracketWidth = BRACKET_WIDTH;
const leafY = slot => 56 + Math.floor(slot / 2) * 54 + slot % 2 * 18;
const roundY = (round, slot, lower) => (leafY(slot * 2 ** round) + leafY((slot + 1) * 2 ** round - 1)) / 2 + (lower ? 512 : 0);

function nodeMarkup(candidates, round, x, y, width, right, regionName) {
  const resolved = round===0 && candidates.length===1 ? candidates[0] : candidates.find(team=>currentP(team.id)?.[round]===1);
  const preferred = resolved ?? [...candidates].sort((a,b)=>(currentP(b.id)?.[round]??0)-(currentP(a.id)?.[round]??0))[0];
  const names = resolved ? displayName(resolved, width-(round===0?22:2)) : round===0 ? 'First Four winner' : '';
  const wonGame = mode==='results' && resolved && round>0 ? data.games.find(game=>game.round===round && game.winnerId===resolved.id) : null;
  const label = `${STAGES[round]}${regionName?` · ${regionName}`:''}. ${resolved?resolved.name:`${round===0?`${candidates.map(team=>team.name).join(' or ')}. `:''}Most likely entrant: ${preferred?.name??'unknown'}`}${mode==='forecast'&&preferred?` · ${exactProbability(currentP(preferred.id)?.[round])}`:''}${wonGame?` · ${wonGame.status==='no-contest'?'':'Won '}${scoreLabel(wonGame)} vs. ${teamById(wonGame.teamIds.find(id=>id!==resolved.id)).name}`:''}`;
  return `<button type="button" tabindex="-1" class="team-node ${right?'right':'left'} ${names?'':'empty'} ${round===0&&!resolved?'playin-slot':''} ${resolved&&lostAtStage(currentP(resolved.id),round)?'eliminated':''}" style="left:${x}px;top:${y}px;width:${width}px" data-x="${x+width/2}" data-y="${y}" data-candidates="${escape(candidates.map(team=>team.id).join(','))}" data-round="${round}" data-resolved="${escape(resolved?.id??'')}" data-team="${escape(preferred?.id??'')}" data-name="${escape(names)}" title="${escape(label)}" aria-label="${escape(label)}. Arrow keys move between slots.">${round===0?`<span class="seed">${resolved?.seed??candidates[0]?.seed}</span>`:''}<span class="node-name">${escape(names)}</span></button>`;
}

function renderBracket() {
  bracketWidth = Math.max(BRACKET_WIDTH, $('#explorer').clientWidth);
  const center = bracketWidth / 2;
  const openingNames=data.teams.map(team=>displayName(team,106));
  if(data.teams.some(team=>team.playIn&&currentP(team.id)?.[0]>0&&currentP(team.id)?.[0]<1)) openingNames.push('First Four winner');
  const openingWidth=22+Math.ceil(Math.max(...openingNames.map(name=>nameMeasure.measureText(name).width)));
  const reclaimed=128-openingWidth;
  const roundX=[6,...[138,210,282,354,426,502].map((x,index)=>x-reclaimed*(5-index)/5+(bracketWidth-BRACKET_WIDTH)/2*index/5)];
  let lines='', nodes='';
  const path = (ids,stage,x,fromY,endX,y,filled=false) => `<path class="connector" data-path-ids="${escape(ids.join(','))}" data-stage="${stage}" data-start-x="${x}" data-start-y="${fromY}" data-label-x="${(x+endX)/2}" data-label-y="${y+(stage===5||fromY>y?25:-13)}" d="M ${x} ${fromY} V ${y}${filled?'':` H ${endX}`}"/>`;
  data.regionOrder.forEach((name,index)=>{
    const right=index>1, lower=index%2, mirror=x=>right?bracketWidth-x:x;
    for(let round=0;round<=4;round++) {
      for(let slot=0;slot<16/2**round;slot++) {
        const y=roundY(round,slot,lower), start=round===0?6:roundX[round]+4, end=roundX[round+1]-4;
        const candidates=bracketCandidates(data,name,round,slot);
        nodes+=nodeMarkup(candidates,round,right?mirror(end):start,y,end-start,right,name);
        if(round===0||candidates.some(team=>currentP(team.id)?.[round]===1)) lines+=`<path class="terminal-connector" d="M ${mirror(end)} ${y} H ${mirror(roundX[round+1])}"/>`;
        if(round>0) for(let child=0;child<2;child++) lines+=path(bracketCandidates(data,name,round-1,slot*2+child).map(team=>team.id),round,mirror(roundX[round]),roundY(round-1,slot*2+child,lower),mirror(roundX[round+1]),y,candidates.some(team=>currentP(team.id)?.[round]===1));
      }
    }
    lines+=path(data.teams.filter(team=>team.region===name).map(team=>team.id),5,mirror(roundX[5]),roundY(4,0,lower),mirror(roundX[6]),FINAL_Y,data.teams.some(team=>data.finalFourPairs[right?1:0].includes(team.region)&&currentP(team.id)?.[5]===1));
  });
  data.finalFourPairs.forEach((pair,index)=>{
    const candidates=data.teams.filter(team=>pair.includes(team.region));
    nodes+=nodeMarkup(candidates,5,index===0?roundX[5]+4:center+4,FINAL_Y,center-roundX[5]-8,index===1);
    if(candidates.some(team=>currentP(team.id)?.[5]===1)) lines+=`<path class="terminal-connector" d="M ${center+(index===0?-4:4)} ${FINAL_Y} H ${center}"/>`;
    lines+=`<path class="connector title-stem" data-path-ids="${escape(candidates.map(team=>team.id).join(','))}" data-stage="6" data-start-x="${center}" data-start-y="${FINAL_Y}" d="M ${center} ${FINAL_Y} V ${FINAL_Y-45}"/>`;
  });
  nodes+=nodeMarkup(data.teams,6,center-36,FINAL_Y-45,72,false);
  const headings=['Round of 64','Round of 32','Sweet 16','Elite Eight','Final Four','Championship','Final Four','Elite Eight','Sweet 16','Round of 32','Round of 64'];
  const leftColumns=roundX.slice(0,5).map((x,index)=>(x+roundX[index+1]-(index===0?4:0))/2);
  const columns=[...leftColumns,center,...leftColumns.map(x=>bracketWidth-x).reverse()];
  const coverage=mode==='forecast'?snapshotStatus(data,snapshotIndex):null;
  const status=!coverage?'Completed results':!coverage.throughDate?'Pre-tournament forecast':coverage.partial?coverage.label:`Through ${dateLabel(coverage.throughDate)} games`;
  $('#bracket-panel').innerHTML=`<p class="bracket-scroll-hint">Scroll to see the full bracket, or choose Table.</p><div class="bracket-scroll"><div class="bracket-map"><div class="round-labels">${headings.map((label,index)=>`<span style="left:${columns[index]}px">${label}</span>`).join('')}</div><div class="bracket-tree"><svg class="connectors" viewBox="0 0 ${bracketWidth} ${BRACKET_HEIGHT}" aria-hidden="true"><g class="bracket-backbone">${lines}</g><g class="active-route"></g><g class="route-probabilities"></g></svg>${data.regionOrder.map((name,index)=>`<h3 class="region-name ${index>1?'right':''}" style="top:${index%2?520:8}px">${escape(name)}</h3>`).join('')}${nodes}<p class="bracket-status"><span>${escape(status)}</span>${mode==='forecast'&&reconstructed()?'<br><strong>Reconstructed model</strong>':''}<small class="bracket-hint">Move over the bracket to preview. Arrow keys move between slots.</small></p><div class="title-forecast"><p id="title-team"></p><div class="title-probability"></div><p class="center-note"></p><ol id="title-leaders"></ol></div></div></div></div>`;
  slots=[...$('#bracket-panel').querySelectorAll('.team-node')].map(element=>({element,x:Number(element.dataset.x),y:Number(element.dataset.y),round:Number(element.dataset.round),id:element.dataset.team}));
  slots[0].element.tabIndex=0;
  previewId=undefined;
  previewRound=undefined;
  decorateRoute(null);
}

function firstFourMarkup() {
  const games = data.games.filter(game=>game.round===0);
  if (!games.length) return '';
  return `<section class="first-four" aria-label="First Four games"><h3>First Four</h3><div class="play-in-games">${games.map(game=>`<div class="play-in"><p>${escape(game.region)} · A place in the 64</p>${game.teamIds.map((id,index)=>{ const team=teamById(id); return `<button type="button" data-team="${escape(id)}">${escape(team?.name)}<span>${mode==='forecast'?probabilityLabel(currentP(id)?.[0]):escape(game.scores[index]??'—')}</span></button>`; }).join('')}</div>`).join('')}</div></section>`;
}

function decorateRoute(id, round) {
  if(id===previewId && round===previewRound) return;
  const changedTeam=id!==previewId;
  previewId=id;
  previewRound=round;
  const team=teamById(id), probabilities=team?currentP(id):[];
  if(changedTeam) {
    const routes=[], labels=[], unresolved=new Set(unresolvedStages(probabilities));
    const lines=[...$('#bracket-panel').querySelectorAll('.bracket-backbone .connector')];
    for(const line of lines) {
      const stage=Number(line.dataset.stage), p=probabilities[stage]??0;
      if(!line.dataset.pathIds.split(',').includes(id) || !unresolved.has(stage)) continue;
      const width=.5+15*Math.sqrt(p);
      routes.push(`<path class="connector route" data-stage="${stage}" pathLength="1" d="${line.getAttribute('d')}" style="stroke-width:${width}"/>`);
      // The other three quarters lie inside the two strokes. Only the outer corner adds area.
      if(stage>1 && unresolved.has(stage-1)) routes.push(`<ellipse class="route-join" data-stage="${stage}" cx="${line.dataset.startX}" cy="${line.dataset.startY}" style="rx:${width/2}px;ry:${(.5+15*Math.sqrt(probabilities[stage-1]))/2}px"/>`);
      if(stage<6 && mode==='forecast') labels.push(`<text data-stage="${stage}" x="${line.dataset.labelX}" y="${line.dataset.labelY}" text-anchor="middle">${probabilityLabel(p)}</text>`);
    }
    const routeGroup=$('.active-route');
    routeGroup.querySelectorAll('.retiring').forEach(path=>path.remove());
    [...routeGroup.children].forEach(element=>{
      if(reducedMotion.matches) element.remove();
      else animateRoute(element,true);
    });
    routeGroup.insertAdjacentHTML('beforeend',routes.join(''));
    $('.route-probabilities').innerHTML=labels.join('');
    const champion = !team && mode==='results' ? data.teams.find(item=>currentP(item.id)[6]===1) : null;
    const final = data.games.find(game=>game.round===6);
    const loss = team && isEliminated(id) ? data.games.find(game=>game.teamIds.includes(id) && game.winnerId!==id) : null;
    $('#title-team').textContent=team?.name ?? champion?.name ?? 'Leading title chances';
    $('.title-probability').textContent=!team ? champion ? scoreLabel(final) : '' : mode==='results' ? probabilities[6]===1 ? scoreLabel(final) : '' : isEliminated(id) ? '' : probabilities[6]===0 ? '<1%' : percent(probabilities[6]);
    $('.title-probability').title=team&&mode==='forecast'?exactProbability(probabilities[6]):'';
    $('.title-probability').classList.toggle('long-probability',$('.title-probability').textContent.length>5);
    $('.center-note').textContent=loss ? `Out · ${loss.status==='no-contest'?'did not advance against':'lost to'} ${teamById(loss.teamIds.find(other=>other!==id)).bracketName} in the ${loss.roundName??STAGES[loss.round-1]}` : !team ? champion ? `${data.year} champion · vs. ${teamById(final.teamIds.find(other=>other!==champion.id)).bracketName}` : '' : mode==='results' ? probabilities[6]===1 ? `${data.year} champion` : resultStatus(probabilities) : 'Chance of winning the tournament';
    $('#title-leaders').innerHTML=!team && mode==='forecast' ? [...data.teams].filter(item=>!isEliminated(item.id)).sort((a,b)=>currentP(b.id)[6]-currentP(a.id)[6]).slice(0,5).map(item=>`<li><span>${escape(item.bracketName)}</span><strong title="${exactProbability(currentP(item.id)[6])}">${percent(currentP(item.id)[6])}</strong></li>`).join('') : '';
    $('.title-forecast').classList.toggle('team-forecast',Boolean(team)&&mode==='forecast');
    for(const {element:node} of slots) {
      const stage=Number(node.dataset.round), resolved=node.dataset.resolved;
      const inPath=Boolean(team&&node.dataset.candidates.split(',').includes(id)&&probabilities[stage]>0);
      node.classList.toggle('selected',inPath&&(stage===0||resolved===id));
      node.querySelector('.node-name').textContent=node.classList.contains('playin-slot')&&inPath?displayName(team,106):node.dataset.name;
    }
    const firstStage=Math.min(...[...unresolved].filter(stage=>stage>0));
    const origin=slots.find(slot=>slot.round===firstStage-1&&slot.element.dataset.candidates.split(',').includes(id));
    const firstLine=lines.find(line=>Number(line.dataset.stage)===firstStage&&line.dataset.pathIds.split(',').includes(id));
    if(origin&&firstLine) {
      const name=origin.element.querySelector('.node-name').getBoundingClientRect(), tree=$('.bracket-tree').getBoundingClientRect();
      const right=origin.element.classList.contains('right');
      const x=(right?name.left-4:name.right+4)-tree.left;
      const path=$(`.active-route path[data-stage="${firstStage}"]:not(.retiring)`);
      const turns=firstLine.getAttribute('d').slice(firstLine.getAttribute('d').indexOf(' V '));
      path.setAttribute('d',`M ${x} ${firstLine.dataset.startY} H ${firstLine.dataset.startX}${turns}`);
    }
    if(!reducedMotion.matches) {
      const paths=[...routeGroup.querySelectorAll('path:not(.retiring)')].sort((a,b)=>Number(a.dataset.stage)-Number(b.dataset.stage));
      const length=paths.reduce((sum,path)=>sum+path.getTotalLength(),0), timing=new Map();
      let delay=0;
      for(const path of paths) {
        const duration=450*path.getTotalLength()/length;
        timing.set(Number(path.dataset.stage),{duration,delay});
        delay+=duration;
      }
      const startTime=document.timeline.currentTime;
      routeGroup.querySelectorAll(':scope > :not(.retiring)').forEach(element=>animateRoute(element,false,timing,startTime));
    }
    // Reveal the title chance once its route has reached the center; replay redraws every step, so keep it steady there.
    const center=$('.title-forecast'), drawing=timer?[]:[...routeGroup.querySelectorAll(':scope > :not(.retiring)')].flatMap(element=>element.getAnimations());
    center.classList.toggle('drawing',drawing.length>0);
    if(drawing.length) Promise.all(drawing.map(animation=>animation.finished)).then(()=>{if(previewId===id)center.classList.remove('drawing');},()=>{});
  }
  $('.route-probabilities').querySelectorAll('text').forEach(label=>label.classList.toggle('selected-percentage',Number(label.dataset.stage)===round));
}

function animateRoute(element, retiring, timing, startTime) {
  const stage=Number(element.dataset.stage), line=element.tagName==='path';
  const properties=line?{strokeWidth:stage}:{rx:stage,ry:stage-1};
  const computed=getComputedStyle(element);
  if(retiring && computed.visibility==='hidden') { element.remove(); return; }
  // Snapshot before cancelling so a rapid pointer change cannot jump to full width.
  const current=Object.fromEntries(Object.keys(properties).map(key=>[key,computed[key]]));
  const dash={strokeDasharray:computed.strokeDasharray,strokeDashoffset:computed.strokeDashoffset};
  element.getAnimations().forEach(animation=>animation.cancel());
  if(retiring) element.classList.add('retiring');
  const animations=Object.entries(properties).map(([property,round])=>{
    const from={[property]:retiring?current[property]:'0px'};
    const to={[property]:retiring?'0px':element.style[property]};
    if(line) {
      Object.assign(from,retiring?dash:{strokeDasharray:'1',strokeDashoffset:1});
      Object.assign(to,retiring?dash:{strokeDasharray:'1',strokeDashoffset:0});
    }
    const animation=element.animate([from,to],retiring?{duration:50+round*25,fill:'forwards'}:{...timing.get(round),fill:'backwards'});
    if(!retiring) animation.startTime=startTime;
    return animation;
  });
  if(!line && !retiring) {
    const incoming=timing.get(stage-1);
    // Wait for the incoming dash to reach the seam; no detached corner during drawing.
    element.animate([{visibility:'hidden'},{visibility:'hidden'}],{duration:incoming.delay+incoming.duration}).startTime=startTime;
  }
  if(retiring) Promise.all(animations.map(animation=>animation.finished)).then(()=>element.remove()).catch(()=>{});
}

function renderTable() {
  const stages=STAGES.map((label,index)=>({key:`p${index}`,label:index===6?'Win title':label}));
  const allFirstRoundKnown=data.teams.every(team=>[0,1].includes(currentP(team.id)?.[0]));
  const columns=narrow.matches?[{key:'name',label:'Team'},stages[6],...stages.slice(allFirstRoundKnown?1:0,6)]:[{key:'name',label:'Team'},{key:'region',label:'Region'},{key:'seed',label:'Seed'},...stages];
  const teams=sortTeams(data.teams,{teams:data.teams.map(team=>({id:team.id,p:currentP(team.id)}))},sort);
  const probabilityCell=(p,stage)=>{
    const bin=p===1?'reached':!p ? 'plain' : p<.1?'low':p<.3?'medium':p<.6?'high':'very-high';
    return `<td class="odds-${bin} ${stage===6?'title-column':''}" title="${escape(exactProbability(p))}"><span aria-label="${escape(mode==='forecast'?p===1?'Already reached':p===0?'Zero chance':percent(p):p===1?'Reached':'Did not reach')}">${probabilityLabel(p)}</span></td>`;
  };
  $('#table-panel').innerHTML=`<div class="table-scroll" tabindex="0" aria-label="${mode==='forecast'?'Forecast probability':'Stages reached'} table; scroll for all columns"><table class="odds-table"><caption><span>${mode==='forecast'?`${escape(provider())} · ${escape(snapshotName())} · Chance of reaching each stage`:`${data.year} results · Stages actually reached`}. Select a heading to sort.</span></caption><thead><tr>${columns.map(column=>`<th scope="col" class="${column.key==='name'?'team-column':column.key==='region'?'text-column':column.key==='p6'?'title-column':''}" aria-sort="${sort.key===column.key?(sort.direction===1?'ascending':'descending'):'none'}"><button type="button" data-sort="${column.key}"><span>${column.label}</span></button></th>`).join('')}</tr></thead><tbody>${teams.map(team=>`<tr data-team="${escape(team.id)}">${columns.map(column=>column.key==='name'?`<th scope="row" class="team-column">${narrow.matches?`<span class="table-seed">${team.seed}</span> ${escape(team.bracketName)}`:escape(team.name)}</th>`:column.key==='region'?`<td class="text-column">${escape(team.region)}</td>`:column.key==='seed'?`<td>${team.seed}</td>`:probabilityCell(currentP(team.id)?.[Number(column.key.slice(1))],Number(column.key.slice(1)))).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function applySource(id) {
  sourceId = id;
  const option = activeSource();
  data.forecasts = id === 'fivethirtyeight' ? cache.get(`${gender}/${data.year}`).forecasts : option.forecasts;
  data.forecastProvider = option.name;
  $('#source').value = id;
  $('#year-coverage').textContent = reconstructed() ? 'Reconstructed forecast & results' : 'Archived forecasts & results';
}

function updateAboutLinks() {
  const query = new URLSearchParams({competition: gender, year: data.year, source: sourceId});
  document.querySelectorAll('.about-link').forEach(link => link.href = `./about.html?${query}`);
}

for (const competition of ['mens','womens']) $(`#${competition}`).addEventListener('click',()=>loadYear(Number($('#year').value),competition));
$('#year').addEventListener('change',event=>loadYear(Number(event.target.value)));
$('#source').addEventListener('change', event => {
  const date = data.forecasts[snapshotIndex]?.date;
  stopPlaying(); preferredSource = event.target.value; applySource(preferredSource);
  snapshotIndex = date ? nearestSnapshot(data.forecasts, snapshotDay(date)) : 0;
  updateAboutLinks(); render(); announce(`${provider()} selected. ${snapshotName()}.`);
});
$('#forecast-mode').addEventListener('click',()=>{stopPlaying();mode='forecast';render();announce(`${provider()} ${reconstructed() ? 'reconstructed' : 'published historical'} timeline shown.`);});
$('#results-mode').addEventListener('click',()=>{stopPlaying();mode='results';render();announce('Actual tournament results shown.');});
$('#bracket-view').addEventListener('click',()=>{explicitView=true;view='bracket';render();});
$('#table-view').addEventListener('click',()=>{explicitView=true;view='table';render();});
function chooseSnapshot(index) { stopPlaying(); snapshotIndex=index; render(); }
$('#snapshot').addEventListener('click',event=>{
  if(data.forecasts.length<2||event.target.closest('.unavailable')) return;
  const tick=event.target.closest('[data-snapshot]');
  const { start: firstDay, end: lastDay } = snapshotRange();
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
  $('#play').innerHTML='Ⅱ <span>Pause</span>';
  $('#play').setAttribute('aria-label','Pause tournament');
  timer=setInterval(()=>{snapshotIndex++;render();if(snapshotIndex>=data.forecasts.length-1){stopPlaying();announce('Reached the last available forecast.');}},500);
});
const nearestSlot=event=>{
  const bounds=$('.bracket-tree').getBoundingClientRect(), x=event.clientX-bounds.left, y=event.clientY-bounds.top;
  return slots.reduce((nearest,slot)=>(slot.x-x)**2+(slot.y-y)**2<(nearest.x-x)**2+(nearest.y-y)**2?slot:nearest);
};
for (const panel of [$('#bracket-panel'), $('#first-four-panel')]) {
  panel.addEventListener('pointermove',event=>{
    if(timer) return;
    if(event.target.closest('.bracket-tree')) { const slot=nearestSlot(event); decorateRoute(slot.id,slot.round); }
    else if(event.target.closest('.play-in [data-team]')) decorateRoute(event.target.closest('[data-team]').dataset.team,0);
    else decorateRoute(null);
  });
  // Touch has no hover, so a tap previews; touch fires pointerleave before the click.
  panel.addEventListener('click',event=>{
    if(timer) return;
    const slot=event.target.closest('.bracket-tree')&&(event.detail===0?slots.find(slot=>slot.element===event.target.closest('.team-node')):nearestSlot(event));
    const id=slot?.id??event.target.closest('.play-in [data-team]')?.dataset.team;
    if(id) decorateRoute(id,slot?.round??0);
  });
  panel.addEventListener('pointerleave',()=>{if(!timer)decorateRoute(null);});
  panel.addEventListener('focusin',event=>{
    const button=event.target.closest('[data-team]');
    if(button) {
      if(button.classList.contains('team-node')) slots.forEach(({element})=>element.tabIndex=element===button?0:-1);
      if(!timer)decorateRoute(button.dataset.team,Number(button.dataset.round??0));
    }
  });
  panel.addEventListener('focusout',event=>{if(!panel.contains(event.relatedTarget))decorateRoute(null);});
}
$('#bracket-panel').addEventListener('keydown',event=>{
  const current=slots.find(slot=>slot.element===event.target);
  if(!current||!event.key.startsWith('Arrow')) return;
  event.preventDefault();
  const center = bracketWidth / 2;
  let candidates;
  if(event.key==='ArrowUp'||event.key==='ArrowDown') {
    const direction=event.key==='ArrowDown'?1:-1;
    candidates=slots.filter(slot=>slot.round===current.round&&(slot.x<center)===(current.x<center)&&(slot.y-current.y)*direction>0);
  } else {
    const direction=event.key==='ArrowRight'?1:-1;
    const nextRound=current.round+(direction===(current.x<center?1:-1)?1:-1);
    candidates=current.round===6?slots.filter(slot=>slot.round===5&&(slot.x-center)*direction>0):slots.filter(slot=>slot.round===nextRound&&(slot.x<center)===(current.x<center));
    if(nextRound===6) candidates=slots.filter(slot=>slot.round===6);
  }
  const next=candidates.sort((a,b)=>Math.abs(a.y-current.y)-Math.abs(b.y-current.y))[0];
  next?.element.focus();
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&data?.status==='played'){stopPlaying();if(view==='bracket')decorateRoute(null);}});
let previousNarrow=narrow.matches;
new ResizeObserver(()=>{
  if(!data||data.status!=='played')return;
  const nextView=$('#explorer').clientWidth>=BRACKET_WIDTH?'bracket':'table';
  if(!explicitView&&view!==nextView){view=nextView;render();}
  else if(view==='bracket'&&bracketWidth!==Math.max(BRACKET_WIDTH,$('#explorer').clientWidth))renderBracket();
  else if(view==='table'&&previousNarrow!==narrow.matches)renderTable();
  previousNarrow=narrow.matches;
}).observe($('#explorer'));
$('#table-panel').addEventListener('click',event=>{
  const button=event.target.closest('[data-sort]');if(!button)return;
  if(button.dataset.sort){sort={key:button.dataset.sort,direction:sort.key===button.dataset.sort?-sort.direction:button.dataset.sort.startsWith('p')?-1:1};renderTable();$(`[data-sort="${sort.key}"]`).focus();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlaying();});
window.addEventListener('pagehide',stopPlaying);
window.addEventListener('pageshow',event=>{if(event.persisted && data?.status==='played' && !$('#workspace').hidden && view==='bracket')renderBracket();});

await document.fonts.ready;
try {
  const response=await fetch(`${import.meta.env.BASE_URL}data/index.json?v=${DATA_REVISION}`);
  if(!response.ok)throw new Error('Could not load the tournament index.');
  catalog=await response.json();
  $('#year').innerHTML=catalog.competitions.mens.years.map(entry=>`<option value="${entry.year}">${entry.year}${entry.status==='cancelled'?' · Cancelled':''}</option>`).join('');
  $('#year').disabled=false;
  $('#year').value='2026';
  await loadYear(2026);
} catch(error) { $('#loading').textContent=`${error.message} Reload to try again.`; $('#explorer').setAttribute('aria-busy','false'); }
