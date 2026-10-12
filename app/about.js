import './style.css';

const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const dateLabel = (value, year = false) => new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC' });
let catalog, data, sourceId, gender, request = 0;
const activeSource = () => data.forecastOptions?.find(option => option.id === sourceId);
const competitionName = () => gender === 'womens' ? 'Women’s' : 'Men’s';
const reconstructed = () => data.forecasts?.[0]?.kind === 'reconstructed';
const params = new URLSearchParams(location.search);
let preferredSource = params.get('source') ?? 'fivethirtyeight';
let publishedForecasts;

function showSource() {
  const options = data.forecastOptions ?? [];
  sourceId = options.some(option => option.id === preferredSource) ? preferredSource : options[0]?.id;
  const option = activeSource();
  data.forecasts = sourceId === 'fivethirtyeight' ? publishedForecasts : option?.forecasts;
  $('#source').value = sourceId ?? '';
  renderSources();
  const query = new URLSearchParams({competition: gender, year: data.year});
  if (sourceId) query.set('source', sourceId);
  history.replaceState(null, '', `${location.pathname}?${query}${location.hash}`);
  $('#evidence-status').textContent = `${competitionName()} ${data.year}${option ? ` · ${option.name}` : ' · Tournament cancelled'}`;
}

async function loadEvidence() {
  const currentRequest = ++request;
  gender = $('#competition').value;
  const entry = catalog.competitions[gender].years.find(item => item.year === Number($('#year').value));
  $('#source').disabled = true;
  $('#evidence-status').textContent = 'Loading tournament evidence…';
  document.querySelectorAll('.about-section').forEach(section => section.hidden = true);
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/${entry.file}`);
    if (!response.ok) throw new Error('Could not load tournament evidence.');
    const loaded = await response.json();
    if (currentRequest !== request) return;
    data = loaded;
    publishedForecasts = data.forecasts;
    const options = data.forecastOptions ?? [];
    $('#source').innerHTML = options.length ? options.map(option => `<option value="${escape(option.id)}">${escape(option.name)}</option>`).join('') : '<option value="">No forecasts</option>';
    $('#source').disabled = !options.length;
    document.querySelectorAll('.about-section').forEach(section => section.hidden = false);
    showSource();
  } catch (error) {
    if (currentRequest === request) $('#evidence-status').textContent = `${error.message} Select a tournament to try again.`;
  }
}

$('#competition').addEventListener('change', loadEvidence);
$('#year').addEventListener('change', loadEvidence);
$('#source').addEventListener('change', event => { preferredSource = event.target.value; showSource(); });

try {
  const response = await fetch(`${import.meta.env.BASE_URL}data/index.json`);
  if (!response.ok) throw new Error('Could not load the tournament index.');
  catalog = await response.json();
  gender = params.get('competition') === 'womens' ? 'womens' : 'mens';
  $('#competition').value = gender;
  const years = catalog.competitions[gender].years;
  $('#year').innerHTML = years.map(entry => `<option value="${entry.year}">${entry.year}${entry.status === 'cancelled' ? ' · Cancelled' : ''}</option>`).join('');
  $('#year').value = years.some(entry => String(entry.year) === params.get('year')) ? params.get('year') : String(years.at(-1).year);
  $('#competition').disabled = $('#year').disabled = false;
  await loadEvidence();
} catch (error) { $('#evidence-status').textContent = `${error.message} Reload to try again.`; }

function renderSources() {
  const option = activeSource(), report = data.ensembleReport;
  const sourceOptions = (data.forecastOptions ?? []).filter(o => o.url);
  const sourceNames = Object.fromEntries(sourceOptions.map(o => [o.id, o.name]));
  const names = id => sourceNames[id] ?? (id === 'average' ? 'All source average' : 'All source ensemble');
  $('#about-coverage').textContent = data.status === 'cancelled' ? '2020 has no bracket because the tournament was cancelled.' : `${competitionName()} ${data.year}: ${sourceOptions.length} complete opening ${sourceOptions.length === 1 ? 'source' : 'sources'}. ${reconstructed() ? 'The selected timeline recomputes opening odds after each day’s completed games. These are app reconstructions, not the publisher’s later updates; team strength is not updated from winning margins or injuries.' : `FiveThirtyEight supplies ${data.forecasts.length} published snapshots, from ${dateLabel(data.forecasts[0].date, true)} through ${dateLabel(data.forecasts.at(-1).date, true)}. The archive may end before the championship; missing updates are not reconstructed.`}`;
  const sources = (data.sources ?? []).map(source => typeof source === 'string' ? {url: source, label: source} : source);
  $('#source-list').innerHTML = `<p>${competitionName()} · ${data.year}${option ? ` · Selected: ${escape(option.name)}` : ''}</p>${sourceOptions.length ? `<p>FiveThirtyEight’s source selection shows its published historical snapshots. Other source timelines and both blends use reconstructed updates. For these reconstructions, opening advancement probabilities are fitted to a bracket-specific matchup model. Missing First Four odds are inferred from the teams’ Round of 32 shares. Rounded values are reconciled to a valid bracket; the underlying matchup model is not uniquely determined by published advancement odds. Venue effects present in the opening forecasts are implicit in this fit, not independently estimated.</p><ul>${sourceOptions.map(o => `<li><a href="${escape(o.url)}" target="_blank" rel="noreferrer">${escape(o.name)}</a> · ${o.dateKnown ? dateLabel(o.date, true) : 'Publisher’s undated Pre-Tourney option; timeline begins the day before play'}${o.id === 'fivethirtyeight' ? ' · Published archive; its opening forecast is also fitted separately for the blends.' : ` · Largest opening adjustment: ${(100*o.fit.maxError).toFixed(3)} percentage points.`}${o.id === 'silver' ? ' The published LSU/UCLA half-region totals 100.7% to reach the Elite Eight; the reconstruction normalizes that inconsistency.' : ''}</li>`).join('')}</ul>` : ''}<details><summary>Original archives and recorded results</summary><ul>${sources.map(source => `<li>${source.url ? `<a href="${escape(source.url)}" target="_blank" rel="noreferrer">${escape(source.label ?? source.name ?? source.title ?? source.provider ?? source.url)}</a>` : escape(source.label ?? source.name ?? 'Source')}</li>`).join('')}</ul>${data.corrections?.length ? `<p>Recorded source reconciliation:</p><ul>${data.corrections.map(c => `<li>${escape(c.reason)}</li>`).join('')}</ul>` : ''}</details><p><a href="${import.meta.env.BASE_URL}data/${catalog.competitions[gender].years.find(entry => entry.year === data.year).file}" download="tournament-${gender}-${data.year}.json">Download this year’s bundled data</a></p>`;
  $('#ensemble-review').hidden = data.status === 'cancelled';
  document.querySelector('.about-contents a[href="#ensemble-review"]').hidden = data.status === 'cancelled';
  if(!report) { $('#ensemble-comparison').textContent = 'No ensemble evaluation is available for this tournament.'; return; }
  const ensemble = data.forecastOptions.find(o => o.id === 'ensemble');
  const availability = ensemble ? `The ${data.year} blend is fitted using ${ensemble.trainingGames} games from ${ensemble.trainingYears.join(', ')}. No ${data.year} outcomes enter its fitted weights.` : report.trainingYears.length ? `No all-source ensemble is available: ${report.missingInputs.map(names).join(', ')} has no prior-season observations. The comparison below evaluates the historically available inputs.` : 'No ensemble is available because these source inputs have no prior-season observations in this competition.';
  const signed = value => `${value > 0 ? '+' : ''}${value.toFixed(4)}`;
  $('#ensemble-comparison').innerHTML = `<p><strong>${competitionName()} · ${data.year}</strong>. ${escape(availability)}</p><p>The arithmetic average gives each source equal weight. Both blends and the comparison below use opening-derived matchup models, including FiveThirtyEight’s; they do not use its later published updates. The ensemble fits a regularized logistic model to source-derived matchup log-odds. Missing historical source inputs use the mean available log-odds for that game. Men and women are fitted separately; every current input must have earlier observations.</p>${report.rows.length ? `<p>Each historical season is tested using only seasons before it for training. Scores are averaged equally across tested seasons. Lower Brier score (squared probability error) and log loss are better. Positive improvement means the ensemble did better; negative means it did worse. Each row compares exactly the same games. The available source combination varies by historical season.</p><div class="table-scroll" tabindex="0" aria-label="Historical forecast comparison"><table class="comparison-table"><caption>Earlier-season game predictions · ${report.folds.map(f => f.year).join(', ')}</caption><thead><tr><th scope="col">Source</th><th scope="col">Test years</th><th scope="col">Games</th><th scope="col">Brier</th><th scope="col">Ensemble Brier</th><th scope="col">Improvement</th><th scope="col">Log loss</th><th scope="col">Ensemble log loss</th></tr></thead><tbody>${report.rows.map(r => `<tr><th scope="row">${escape(names(r.id))}</th><td>${r.years.join(', ')}</td><td>${r.games}</td><td>${r.brier.toFixed(4)}</td><td>${r.ensembleBrier.toFixed(4)}</td><td>${signed(r.improvement)}</td><td>${r.logLoss.toFixed(4)}</td><td>${r.ensembleLogLoss.toFixed(4)}</td></tr>`).join('')}</tbody></table></div><p>This tests the historical blending procedure, not the displayed year’s fitted coefficients. It measures game prediction, not guaranteed improvement in championship forecasts.</p>` : '<p>No earlier season can yet be independently tested after training on an even earlier season. Training accuracy is not presented as evidence of improvement.</p>'}${ensemble ? `<details><summary>Fitted coefficients</summary><p>No intercept is used, so reversing teams complements their win probabilities. Coefficients act on log-odds; they are not percentage shares.</p><ul>${ensemble.sourceIds.map((id,i) => `<li>${escape(names(id))}: ${ensemble.weights[i].toFixed(4)}</li>`).join('')}</ul></details>` : ''}`;
}
