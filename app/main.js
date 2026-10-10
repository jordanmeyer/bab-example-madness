import './style.css';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, AriaComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
echarts.use([LineChart, GridComponent, TooltipComponent, AriaComponent, SVGRenderer]);
import { echartsTheme } from './theme/echarts.js';
import { STAGES, probabilityLabel, exactProbability, probabilitiesFor, resultPath, teamHistory, bracketCandidates, resolvedTeam, sortTeams, snapshotDay, nearestSnapshot } from './model.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const dateLabel = (value, year = false) => new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC' });
const narrow = matchMedia('(max-width: 1100px)');
let catalog, data, selectedId, region, snapshotIndex = 0, mode = 'forecast', view = narrow.matches ? 'table' : 'bracket';
let sort = { key: 'p6', direction: -1 }, timer, request = 0, chart, observer, bracketObserver, pathMap, previewId;
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
  bracketObserver?.disconnect();
  $('#explorer').setAttribute('aria-busy', 'true');
  $('#workspace').hidden = true;
  $('#cancelled').hidden = true;
  $('#loading').hidden = false;
  $('#loading').textContent = `Loading the ${year} tournament…`;
  try {
    if (!cache.has(year)) {
      const entry = catalog.years.find(item => item.year === year);
      const response = await fetch(`${import.meta.env.BASE_URL}data/${entry.file ?? `${year}.json`}`);
      if (!response.ok) throw new Error('Tournament file could not be loaded.');
      cache.set(year, await response.json());
    }
    if (thisRequest !== request) return;
    data = cache.get(year);
    snapshotIndex = 0;
    mode = data.forecasts?.length ? 'forecast' : 'results';
    region = data.regionOrder?.[0];
    selectedId = null;
    $('#loading').hidden = true;
    $('#year-coverage').textContent = data.status === 'cancelled' ? 'Cancelled · no tournament' : data.forecasts?.length ? reconstructed() ? 'Reconstructed forecast & results' : 'Archived forecasts & results' : 'Results · forecasts unavailable';
    renderSources();
    if (data.status === 'cancelled') {
      $('#cancelled').hidden = false;
      $('#explorer').setAttribute('aria-busy', 'false');
      announce(`${year}: tournament cancelled. No field or games.`);
      return;
    }
    refreshProbabilities();
    selectedId = sortTeams(data.teams, { teams: data.teams.map(team => ({ id: team.id, p: currentP(team.id) })) })[0]?.id;
    $('#team-select').innerHTML = [...data.teams].sort((a,b) => a.name.localeCompare(b.name)).map(team => `<option value="${escape(team.id)}">${escape(team.name)} · ${team.seed} seed</option>`).join('');
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
  $('#coverage-note').textContent = mode === 'forecast' ? reconstructed() ? 'Reconstructed from pre-tournament T-Rank ratings using log5. This is a separate model, not a FiveThirtyEight or published T-Rank bracket forecast.' : `${provider()}’s recorded probabilities. Select a date to explore what the model said then.` : data.forecasts?.length ? 'Completed games and scores. Switch to Forecasts to explore the uncertainty before the outcome.' : `No FiveThirtyEight forecasts are available for ${data.year}. This view shows actual results, not estimated probabilities.`;
  if (mode === 'forecast') {
    $('#timeline .eyebrow').textContent = reconstructed() ? 'Reconstructed pre-tournament forecast · T-Rank / log5' : `Archived ${provider()} forecast`;
    $('#snapshot-title').textContent = snapshotName();
    const firstDay = snapshotDay(data.forecasts[0].date), lastDay = snapshotDay(data.forecasts.at(-1).date);
    const snapshotDate = data.forecasts[snapshotIndex].date;
    const sameDayRounds = [...new Set(data.games.filter(game => new Date(game.date).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) === snapshotDate).map(game => game.roundName))];
    $('#snapshot-phase').textContent = data.forecasts.length === 1 ? 'One pre-tournament snapshot · no replay' : `${sameDayRounds.length ? `Tournament calendar: ${sameDayRounds.join(' / ')}` : snapshotIndex === 0 ? 'Pre-tournament' : 'Between game dates'} · Daily snapshots may include that day’s games.`;
    $('#snapshot').min = firstDay;
    $('#snapshot').max = lastDay;
    $('#snapshot').value = snapshotDay(snapshotDate);
    $('#snapshot').setAttribute('aria-valuetext', snapshotName());
    $('#snapshot').disabled = data.forecasts.length < 2;
    $('#play').disabled = data.forecasts.length < 2;
    $('#snapshot-dates').innerHTML = data.forecasts.map((snapshot, index) => `<button type="button" data-snapshot="${index}" style="left:${lastDay === firstDay ? 0 : (snapshotDay(snapshot.date)-firstDay)/(lastDay-firstDay)*100}%" aria-pressed="${index===snapshotIndex}" title="${dateLabel(snapshot.date,true)} · Available forecast">${dateLabel(snapshot.date)}</button>`).join('');
    $('#snapshot-select').innerHTML = data.forecasts.map((snapshot, index) => `<option value="${index}" ${index===snapshotIndex?'selected':''}>${dateLabel(snapshot.date,true)}${index===0?' · Initial':index===data.forecasts.length-1?' · Last available':''}</option>`).join('');
    $('#snapshot-select').disabled = data.forecasts.length < 2;
  } else {
    const champion = data.teams.find(team => currentP(team.id)?.[6] === 1);
    $('#results-heading').innerHTML = `<strong>${data.year} champion: ${escape(champion?.name ?? 'Not recorded')}.</strong> Every stage below represents a completed result. Scores and game details appear when you select a team.`;
  }
  $('#explore-help').textContent = view === 'bracket' ? 'Trace a route with a pointer or keyboard focus. Select a team to inspect its story below.' : mode === 'forecast' ? 'Sort a stage to compare chances. Select a team to inspect its forecast history below.' : 'Checkmarks show stages reached. Select a team for its games and scores.';
  $('#team-select').value = selectedId;
  $('#bracket-panel').hidden = view !== 'bracket';
  $('#table-panel').hidden = view !== 'table';
  if (view === 'bracket') renderBracket();
  else renderTable();
  renderDetail();
}

function nodeMarkup(candidates, round, slot, regionName, style) {
  const resolved = round < 5 ? resolvedTeam(data, regionName, round, slot, snapshotIndex, mode) : candidates.find(team => currentP(team.id)?.[round] === 1);
  const ids = candidates.map(team => team.id).join(',');
  const preferred = resolved ?? [...candidates].sort((a,b) => (currentP(b.id)?.[round] ?? 0) - (currentP(a.id)?.[round] ?? 0))[0];
  const content = resolved ? `<span class="seed">${resolved.seed}</span><span class="node-name">${escape(round === 0 ? resolved.name : resolved.shortName)}</span>` : round === 0 ? `<span class="seed">${candidates[0]?.seed ?? ''}</span><span class="node-name">${escape(candidates.map(team => team.shortName).join(' / '))}</span>` : '<span class="node-name">Open slot</span>';
  return `<button type="button" class="team-node ${resolved ? '' : 'empty'}" style="${style}" data-candidates="${escape(ids)}" data-round="${round}" data-slot="${slot}" data-region="${escape(regionName)}" data-resolved="${escape(resolved?.id ?? '')}" data-team="${escape(preferred?.id ?? '')}" title="${escape(resolved ? `${resolved.name} · ${STAGES[round]}` : `${STAGES[round]} slot: ${candidates.map(team => team.name).join(', ')}`)}" aria-label="${escape(resolved ? `${resolved.name}, seed ${resolved.seed}, ${STAGES[round]}. Select for details.` : `${STAGES[round]} open slot. Explore ${preferred?.name ?? 'team'} as its most likely entrant.`)}">${content}</button>`;
}

function regionMarkup(regionName, index) {
  const right = index > 1 && !narrow.matches;
  const start = [0, 40, 61, 82], widths = [38,18,18,18];
  let nodes = '', lines = '';
  for (let round = 0; round < 4; round++) {
    const count = 16 / 2 ** round;
    for (let slot = 0; slot < count; slot++) {
      const y = (slot + .5) * 448 / count;
      const candidates = bracketCandidates(data, regionName, round, slot);
      const x = right ? 100 - start[round] - widths[round] : start[round];
      nodes += nodeMarkup(candidates, round, slot, regionName, `left:${x}%;top:${y/448*100}%`);
      if (round) {
        const nextX = start[round] * 10, previousX = (start[round-1] + widths[round-1]) * 10;
        for (let child = 0; child < 2; child++) {
          const previousY = (slot * 2 + child + .5) * 448 / (count * 2);
          const mirrored = value => right ? 1000 - value : value;
          lines += `<path class="connector" data-path-ids="${escape(bracketCandidates(data,regionName,round-1,slot*2+child).map(team=>team.id).join(','))}" data-stage="${round}" d="M ${mirrored(previousX)} ${previousY} H ${mirrored((nextX+previousX)/2)} V ${y} H ${mirrored(nextX)}"/>`;
        }
      }
    }
  }
  return `<section class="region ${index > 1 ? 'right' : 'left'} ${regionName === region ? 'mobile-active' : ''}" data-region-panel="${escape(regionName)}" aria-label="${escape(regionName)} regional bracket"><div class="region-header"><h3>${escape(regionName)}</h3><span>REGION</span></div><div class="region-tree-wrap" tabindex="0" aria-label="${escape(regionName)} bracket; scroll horizontally if needed"><div class="round-labels">${['Round of 64','Round of 32','Sweet 16','Elite Eight'].map((label,i)=>`<span style="${right ? 'right' : 'left'}:${start[i]}%">${label}</span>`).join('')}</div><div class="region-tree"><svg class="connectors" viewBox="0 0 1000 448" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${nodes}</div></div></section>`;
}

function finalistState(candidates, round, label, id = selectedId) {
  const settled = candidates.find(team => currentP(team.id)?.[round] === 1);
  const selected = candidates.find(team => team.id === id);
  const shown = settled ?? (selected && (currentP(selected.id)?.[round] ?? 0) > 0 ? selected : null);
  const target = shown ?? [...candidates].sort((a,b)=>(currentP(b.id)?.[round]??0)-(currentP(a.id)?.[round]??0))[0];
  return { shown, target, html: `<small>${escape(label)}</small><span>${shown ? escape(shown.shortName) : 'Undecided'}</span>${shown && mode === 'forecast' ? `<small>${settled ? 'Reached' : `${probabilityLabel(currentP(shown.id)?.[round])} chance`}</small>` : ''}` };
}

function finalistMarkup(candidates, round, label) {
  const state = finalistState(candidates, round, label);
  return `<button type="button" class="finalist-button ${state.shown?.id === selectedId ? 'selected' : ''}" data-team="${escape(state.target?.id ?? '')}" data-candidates="${escape(candidates.map(team=>team.id).join(','))}" data-round="${round}" data-label="${escape(label)}" title="${escape(label)}">${state.html}</button>`;
}

function renderBracket() {
  bracketObserver?.disconnect();
  const pairs = data.finalFourPairs;
  const finalists = data.regionOrder.map((name, index) => `<div class="regional-winner ${index>1?'right':'left'} ${index%2?'bottom':'top'}" data-winner-region="${escape(name)}">${finalistMarkup(data.teams.filter(team=>team.region===name),4,`${name} · Final Four`)}</div>`).join('');
  const center = `<section class="center-bracket" aria-label="Final Four and championship">${finalists}<div class="national-final"><p class="eyebrow">National final</p><div class="final-slots">${pairs.map((pair,index)=>finalistMarkup(data.teams.filter(team=>pair.includes(team.region)),5,`${pair.join(' / ')} winner`)).join('')}</div><div class="championship"><p id="title-team" class="eyebrow"></p><div class="title-probability"></div><p class="center-note">${mode==='forecast' ? 'Chance of winning the title' : 'National champion'}</p></div></div></section>`;
  $('#bracket-panel').innerHTML = `<div class="region-navigation"><label for="region">Regional bracket</label><select id="region">${data.regionOrder.map(name=>`<option ${name===region?'selected':''}>${escape(name)}</option>`).join('')}</select><span>Final Four below</span></div><div class="bracket-grid"><svg class="national-connectors" aria-hidden="true"></svg>${regionMarkup(data.regionOrder[0],0)}${center}${regionMarkup(data.regionOrder[2],2)}${regionMarkup(data.regionOrder[1],1)}${regionMarkup(data.regionOrder[3],3)}</div>${firstFourMarkup()}`;
  $('#region').addEventListener('change', event => { selectRegion(event.target.value); drawNationalConnections(); });
  decorateRoute(selectedId);
  bracketObserver = new ResizeObserver(drawNationalConnections);
  $('.bracket-grid').querySelectorAll('.regional-winner, .national-final').forEach(element=>bracketObserver.observe(element));
  bracketObserver.observe($('.bracket-grid'));
  drawNationalConnections();
}

function drawNationalConnections() {
  const grid = $('.bracket-grid');
  if (!grid || view !== 'bracket') return;
  const box = grid.getBoundingClientRect();
  const point = (element, edge) => { const r = element.getBoundingClientRect(); return { x:(edge==='left'?r.left:edge==='right'?r.right:r.left+r.width/2)-box.left, y:(edge==='top'?r.top:edge==='bottom'?r.bottom:r.top+r.height/2)-box.top }; };
  const paths = [];
  const connect = (from, to, ids, stage, vertical = false) => {
    const bend = vertical ? (from.y+to.y)/2 : (from.x+to.x)/2;
    paths.push(`<path class="connector" data-path-ids="${escape(ids)}" data-stage="${stage}" d="M ${from.x} ${from.y} ${vertical?`V ${bend} H ${to.x} V ${to.y}`:`H ${bend} V ${to.y} H ${to.x}`}"/>`);
  };
  data.regionOrder.forEach((name, index) => {
    const regionPanel = [...grid.querySelectorAll('[data-region-panel]')].find(panel=>panel.dataset.regionPanel===name);
    const winner = [...grid.querySelectorAll('[data-winner-region]')].find(node=>node.dataset.winnerRegion===name).querySelector('button');
    const right = index > 1;
    if (!narrow.matches) {
      regionPanel.querySelectorAll('[data-round="3"]').forEach(node=>connect(point(node,right?'left':'right'),point(winner,right?'right':'left'),node.dataset.candidates,4));
    }
    const final = [...grid.querySelectorAll('.final-slots button')].find(node=>node.dataset.candidates.split(',').some(id=>teamById(id).region===name));
    const from = point(winner,index%2?'top':'bottom'), to = point(final,right?'right':'left');
    const lane = to.x + (right?8:-8);
    paths.push(`<path class="connector" data-path-ids="${escape(winner.dataset.candidates)}" data-stage="5" d="M ${from.x} ${from.y} V ${from.y+(index%2?-12:12)} H ${lane} V ${to.y} H ${to.x}"/>`);
  });
  grid.querySelectorAll('.final-slots button').forEach(node=>connect(point(node,'bottom'),point($('.championship'),'top'),node.dataset.candidates,6,true));
  $('.national-connectors').setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
  $('.national-connectors').innerHTML=paths.join('');
  decorateRoute(previewId ?? selectedId);
}

function selectRegion(name) {
  region = name;
  if ($('#region')) $('#region').value = name;
  document.querySelectorAll('[data-region-panel]').forEach(panel=>panel.classList.toggle('mobile-active',panel.dataset.regionPanel===name));
}

function firstFourMarkup() {
  const games = data.games.filter(game=>game.round===0);
  if (!games.length) return '';
  return `<section class="first-four" aria-label="First Four games"><h3>First Four</h3><div class="play-in-games">${games.map(game=>`<div class="play-in"><p>${escape(game.region)} · A place in the 64</p>${game.teamIds.map((id,index)=>{ const team=teamById(id); return `<button type="button" data-team="${escape(id)}" aria-pressed="${id===selectedId}">${escape(team?.name)}<span>${mode==='forecast'?probabilityLabel(currentP(id)?.[0]):escape(game.scores[index]??'—')}</span></button>`; }).join('')}</div>`).join('')}</div></section>`;
}

function decorateRoute(id) {
  const team = teamById(id);
  if (!team) return;
  previewId = id;
  $('#bracket-panel').querySelectorAll('.connector').forEach(line=>{
    const p = currentP(id)?.[Number(line.dataset.stage)] ?? 0;
    const active = line.dataset.pathIds.split(',').includes(id) && p > 0;
    line.classList.toggle('route', active);
    line.style.strokeWidth = active ? 1 + 4 * Math.sqrt(p) : 1;
  });
  $('#bracket-panel').querySelectorAll('.finalist-button').forEach(button => {
    const state = finalistState(button.dataset.candidates.split(',').map(teamById), Number(button.dataset.round), button.dataset.label, id);
    button.innerHTML = state.html;
    button.dataset.team = state.target?.id ?? '';
    button.classList.toggle('selected', state.shown?.id === id);
    button.setAttribute('aria-pressed', state.shown?.id === selectedId);
    button.title = `${button.dataset.label}. ${state.shown ? `${state.shown.name} · ${mode==='forecast'?exactProbability(currentP(state.shown.id)?.[Number(button.dataset.round)]):'Reached'}` : `Open slot. Most likely entrant: ${state.target?.name}`}`;
    button.setAttribute('aria-label', `${button.title}. Select for team details.`);
  });
  if ($('#title-team')) {
    const champion = data.teams.find(candidate=>currentP(candidate.id)?.[6]===1);
    $('#title-team').textContent = mode==='forecast' ? team.name : 'Champion';
    $('.title-probability').textContent = mode==='forecast' ? exactProbability(currentP(id)?.[6]) : champion?.shortName ?? '—';
  }
  $('#bracket-panel').querySelectorAll('.team-node').forEach(node => {
    const round = Number(node.dataset.round), candidates = node.dataset.candidates.split(','), resolved = teamById(node.dataset.resolved);
    const inPath = candidates.includes(id) && (currentP(id)?.[round]??0)>0;
    node.classList.toggle('eliminated', Boolean(resolved && currentP(resolved.id)?.[6] === 0));
    node.classList.toggle('selected', inPath && (round===0 || resolved?.id===id));
    node.classList.toggle('preview', inPath && round>0 && resolved?.id!==id);
    if (inPath) {
      node.innerHTML = `<span class="seed">${team.seed}</span><span class="node-name">${escape(round===0?team.name:team.shortName)}</span>${mode==='forecast' && (round>0 || currentP(id)?.[0]<1)?`<span class="node-value">${probabilityLabel(currentP(id)?.[round])}</span>`:''}`;
      node.title = `${team.name} · ${STAGES[round]} · ${mode==='forecast'?exactProbability(currentP(id)?.[round]):'Reached'}`;
      node.dataset.team = id;
    } else {
      const teams = candidates.map(teamById);
      node.innerHTML = resolved ? `<span class="seed">${resolved.seed}</span><span class="node-name">${escape(round===0?resolved.name:resolved.shortName)}</span>` : round===0 ? `<span class="seed">${teams[0]?.seed??''}</span><span class="node-name">${escape(teams.map(t=>t.shortName).join(' / '))}</span>` : '<span class="node-name">Open slot</span>';
      const preferred = resolved ?? [...teams].sort((a,b)=>(currentP(b.id)?.[round]??0)-(currentP(a.id)?.[round]??0))[0];
      node.dataset.team = preferred?.id ?? '';
      node.title = resolved ? `${resolved.name} · ${STAGES[round]}` : `${STAGES[round]} open slot. Most likely entrant: ${preferred?.name ?? 'unknown'}.`;
    }
    node.setAttribute('aria-label', `${node.title}. Select for team details.`);
    node.setAttribute('aria-pressed', node.dataset.team === selectedId && inPath);
  });
}

function renderTable() {
  const columns = [{key:'name',label:'Team'}, {key:'region',label:'Region'}, {key:'seed',label:'Seed'}, ...STAGES.map((label,index)=>({key:`p${index}`,label: index===6?'Win title':label}))];
  const teams = sortTeams(data.teams,{teams:data.teams.map(team=>({id:team.id,p:currentP(team.id)}))},sort);
  $('#table-panel').innerHTML = `<div class="table-scroll" tabindex="0" aria-label="${mode==='forecast'?'Forecast probability':'Stages reached'} table; scroll for all columns"><table class="odds-table"><caption>${mode==='forecast'?`${escape(provider())} · ${escape(snapshotName())} · Chance of reaching each stage`:`${data.year} results · Checkmarks show stages actually reached`}. Select a column heading to sort.</caption><thead><tr>${columns.map(column=>`<th scope="col" ${column.key==='name'?'class="team-column"':''} aria-sort="${sort.key===column.key?(sort.direction===1?'ascending':'descending'):'none'}"><button type="button" data-sort="${column.key}">${column.label}</button></th>`).join('')}</tr></thead><tbody>${teams.map(team=>`<tr class="${team.id===selectedId?'selected':''}"><th scope="row" class="team-column"><button type="button" data-team="${escape(team.id)}" aria-pressed="${team.id===selectedId}">${escape(team.name)}</button></th><td>${escape(team.region)}</td><td>${team.seed}</td>${(currentP(team.id)??Array(7).fill(null)).map(p=>`<td class="heat-${p===1?5:p===0||p==null?0:p>=.5?4:p>=.25?3:p>=.1?2:1}" title="${escape(exactProbability(p))}"><span aria-label="${escape(mode==='forecast'?p===1?'Already reached':p===0?'Zero chance':exactProbability(p):p===1?'Reached':'Did not reach')}">${probabilityLabel(p)}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function selectTeam(id, announcement = true) {
  if (!teamById(id)) return;
  selectedId = id;
  $('#team-select').value = id;
  if (view==='bracket') {
    decorateRoute(id);
    $('#bracket-panel').querySelectorAll('.play-in button').forEach(button=>button.setAttribute('aria-pressed',button.dataset.team===id));
  } else {
    $('#table-panel').querySelectorAll('tbody tr').forEach(row=>{const button=row.querySelector('[data-team]');row.classList.toggle('selected',button.dataset.team===id);button.setAttribute('aria-pressed',button.dataset.team===id);});
  }
  renderDetail();
  if (announcement) announce(`${teamById(id).name} selected. ${mode==='forecast'?`${exactProbability(currentP(id)?.[6])} championship chance.`:'Game results shown below.'}`);
}

function disposeChart() { observer?.disconnect(); observer=null; chart?.dispose(); chart=null; }

function renderDetail() {
  disposeChart();
  const team=teamById(selectedId), p=currentP(selectedId);
  if (!team) return;
  const stages = `<dl class="stage-strip">${STAGES.map((label,index)=>`<div><dt>${label}</dt><dd title="${escape(exactProbability(p?.[index]))}" aria-label="${escape(mode==='forecast'?exactProbability(p?.[index]):p?.[index]===1?'Reached':'Did not reach')}">${probabilityLabel(p?.[index])}</dd></div>`).join('')}</dl>`;
  const eliminated = p?.[6]===0;
  let copy = mode==='forecast' ? eliminated ? `${team.name} had no remaining path to the title in this snapshot.` : p?.[6]===1 ? `${team.name} had secured the championship in this snapshot.` : `A ${exactProbability(p?.[6])} championship chance still leaves ${exactProbability(1-p[6])} for someone else. Even a favorite has to survive an entire bracket.` : `${team.name} ${p?.[6]===1?'won the championship':`reached ${STAGES[p.lastIndexOf(1)] ?? 'the First Four'}`}. These are completed results, not model probabilities.`;
  $('#team-detail').innerHTML = `<div><p class="eyebrow">Pinned team · select a team to change</p><h2 id="team-title">${escape(team.name)}</h2><p class="team-meta">No. ${team.seed} seed · ${escape(team.region)} · ${data.year}</p><p class="team-summary">${escape(copy)}</p>${mode==='forecast'?`<p class="big-probability">${exactProbability(p?.[6])}</p><p class="eyebrow">Chance of winning the title</p>`:''}${stages}</div><div class="history">${mode==='forecast'?historyMarkup():gamesMarkup()}</div>`;
  if (mode==='forecast') renderChart();
}

function historyMarkup() {
  const history=teamHistory(data,selectedId).slice(0,snapshotIndex+1);
  return `<div class="history-heading"><h3>The forecast, in motion.</h3><span>Title chance · %</span></div><div id="history-chart" role="img" aria-label="${escape(teamById(selectedId).name)} championship probability through the selected snapshot. Readable percentages in the table below; full precision in the data download."></div><p class="chart-note">${history.length===1?data.forecasts.length === 1 ? 'One reconstructed pre-tournament snapshot is available. There is no historical replay for this model.' : 'Only the initial snapshot is shown. Move the date slider to reveal what happened next.':'The line ends at the selected snapshot. Spacing follows elapsed days; recorded dates are not precise tip-off timestamps.'}</p><details class="history-details"><summary>Read forecast history as a table</summary><div class="table-scroll" tabindex="0"><table><thead><tr><th scope="col">Snapshot</th><th scope="col">Title chance</th></tr></thead><tbody>${history.map(point=>`<tr><th scope="row">${dateLabel(point.date,true)}</th><td>${exactProbability(point.p?.[6])}</td></tr>`).join('')}</tbody></table></div></details>`;
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
$('#bracket-view').addEventListener('click',()=>{view='bracket';render();});
$('#table-view').addEventListener('click',()=>{view='table';render();});
$('#team-select').addEventListener('change',event=>{
  if(narrow.matches)selectRegion(teamById(event.target.value).region);
  selectTeam(event.target.value);
});
function chooseSnapshot(index) { stopPlaying(); snapshotIndex=index; render(); }
$('#snapshot').addEventListener('input',event=>chooseSnapshot(nearestSnapshot(data.forecasts,Number(event.target.value))));
$('#snapshot').addEventListener('keydown',event=>{
  const direction = {ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1}[event.key];
  if(direction){event.preventDefault();chooseSnapshot(Math.max(0,Math.min(data.forecasts.length-1,snapshotIndex+direction)));}
});
$('#snapshot-dates').addEventListener('click',event=>{const button=event.target.closest('[data-snapshot]');if(button){chooseSnapshot(Number(button.dataset.snapshot));$(`[data-snapshot="${snapshotIndex}"]`).focus();announce(snapshotName());}});
$('#snapshot-select').addEventListener('change',event=>{chooseSnapshot(Number(event.target.value));announce(snapshotName());});
$('#snapshot').addEventListener('change',()=>announce(snapshotName()));
$('#play').addEventListener('click',()=>{
  if(timer){stopPlaying();return;}
  if(snapshotIndex===data.forecasts.length-1){snapshotIndex=0;render();}
  $('#play').textContent='Pause tournament';
  timer=setInterval(()=>{snapshotIndex++;render();if(snapshotIndex>=data.forecasts.length-1){stopPlaying();announce('Reached the last available forecast.');}},matchMedia('(prefers-reduced-motion: reduce)').matches?2500:1400);
});
$('#bracket-panel').addEventListener('click',event=>{const button=event.target.closest('[data-team]');if(button)selectTeam(button.dataset.team);});
$('#bracket-panel').addEventListener('pointerover',event=>{const button=event.target.closest('[data-team]');if(button)decorateRoute(button.dataset.team);});
$('#bracket-panel').addEventListener('pointerleave',()=>decorateRoute($('#bracket-panel').contains(document.activeElement) ? document.activeElement.closest('[data-team]')?.dataset.team ?? selectedId : selectedId));
$('#bracket-panel').addEventListener('focusin',event=>{const button=event.target.closest('[data-team]');if(button)decorateRoute(button.dataset.team);});
$('#bracket-panel').addEventListener('focusout',event=>{if(!event.relatedTarget?.closest('[data-team]'))decorateRoute(selectedId);});
$('#table-panel').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.team)selectTeam(button.dataset.team);
  if(button.dataset.sort){sort={key:button.dataset.sort,direction:sort.key===button.dataset.sort?-sort.direction:button.dataset.sort.startsWith('p')?-1:1};renderTable();$(`[data-sort="${sort.key}"]`).focus();}
});
narrow.addEventListener('change',()=>{if(data?.status==='played'&&view==='bracket')renderBracket();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlaying();});
window.addEventListener('pagehide',()=>{stopPlaying();disposeChart();bracketObserver?.disconnect();});
window.addEventListener('pageshow',event=>{if(event.persisted && data?.status==='played' && !$('#workspace').hidden){if(mode==='forecast')renderChart();if(view==='bracket')renderBracket();}});

await document.fonts.ready;
try {
  const response=await fetch(`${import.meta.env.BASE_URL}data/index.json`);
  if(!response.ok)throw new Error('Could not load the tournament index.');
  catalog=await response.json();
  $('#year').innerHTML=catalog.years.map(entry=>`<option value="${entry.year}">${entry.year}${entry.status==='cancelled'?' · Cancelled':''}</option>`).join('');
  $('#year').disabled=false;
  $('#year').value='2023';
  await loadYear(2023);
} catch(error) { $('#loading').textContent=`${error.message} Reload to try again.`; $('#explorer').setAttribute('aria-busy','false'); }
