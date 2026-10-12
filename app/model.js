export const STAGES = ['Round of 64', 'Round of 32', 'Sweet 16', 'Elite Eight', 'Final Four', 'Final', 'Champion'];
export const SHORT_STAGES = ['64', '32', '16', '8', '4', '2', '1'];

export function probabilityLabel(p) {
  if (p == null || !Number.isFinite(p)) return '—';
  if (p === 0) return '—';
  if (p === 1) return '✓';
  if (p < .0001) return '<0.01%';
  if (p < .001) return '<0.1%';
  if (p < .01) return '<1%';
  if (p > .99) return '>99%';
  return `${Math.round(p * 100)}%`;
}

export function exactProbability(p) {
  if (p == null) return 'Unavailable';
  if (p > 0 && p < 0.00001) return '<0.001%';
  if (p < 1 && p > 0.99999) return '>99.999%';
  return `${(p * 100).toLocaleString('en-US', { maximumFractionDigits: 3 })}%`;
}

export function probabilitiesFor(data, snapshotIndex, teamId) {
  return data.forecasts?.[snapshotIndex]?.teams.find(team => String(team.id) === String(teamId))?.p ?? null;
}

export function resultPath(data, teamId) {
  const p = Array(7).fill(0);
  for (const game of data.games) {
    if (!game.teamIds.includes(teamId)) continue;
    if (game.round > 0) p.fill(1, 0, game.round);
    if (game.winnerId === teamId) p.fill(1, 0, game.round + 1);
  }
  return p;
}

export function teamsAtSlot(data, region, slot) {
  return data.teams.filter(team => team.region === region && team.bracketSlot === slot);
}

export function bracketCandidates(data, region, round, slot) {
  const size = 2 ** round;
  return data.teams.filter(team => team.region === region && team.bracketSlot >= slot * size && team.bracketSlot < (slot + 1) * size);
}

export function resolvedTeam(data, region, round, slot, snapshotIndex, mode) {
  const candidates = bracketCandidates(data, region, round, slot);
  if (round === 0 && candidates.length === 1) return candidates[0];
  return candidates.find(team => (mode === 'results' ? resultPath(data, team.id) : probabilitiesFor(data, snapshotIndex, team.id))?.[round] === 1) ?? null;
}

export function sortTeams(teams, snapshot, sort = { key: 'p6', direction: -1 }) {
  const probabilities = new Map(snapshot?.teams.map(team => [String(team.id), team.p]) ?? []);
  return [...teams].sort((a, b) => {
    let comparison;
    if (sort.key.startsWith('p')) comparison = (probabilities.get(String(a.id))?.[Number(sort.key.slice(1))] ?? -1) - (probabilities.get(String(b.id))?.[Number(sort.key.slice(1))] ?? -1);
    else if (sort.key === 'seed') comparison = a.seed - b.seed;
    else comparison = String(a[sort.key]).localeCompare(String(b[sort.key]));
    return comparison * sort.direction || a.name.localeCompare(b.name);
  });
}

// Calendar spacing preserves the days with no archived forecast.
export const snapshotDay = date => Date.parse(`${date.slice(0, 10)}T00:00:00Z`) / 86400000;

export function nearestSnapshot(forecasts, day) {
  return forecasts.reduce((best, snapshot, index) => Math.abs(snapshotDay(snapshot.date) - day) < Math.abs(snapshotDay(forecasts[best].date) - day) ? index : best, 0);
}

// A completed stage has a filled name strip; only uncertain advancement gets a route band.
export const unresolvedStages = p => p.flatMap((chance, stage) => chance > 0 && chance < 1 ? [stage] : []);
export const lostAtStage = (p, stage) => stage < 6 && p[stage] === 1 && p[stage + 1] === 0;

export function resultStatus(p) {
  if (p[6] === 1) return 'Winner';
  const stage = p.lastIndexOf(1);
  return `Eliminated in ${stage < 0 ? 'First Four' : STAGES[stage]}`;
}

// Dates in the archive are daily, not timestamps. A game is included only when its
// winner's next berth is certain and the other team's chance of that berth is zero.
export function snapshotStatus(data, snapshotIndex) {
  const snapshot = data.forecasts[snapshotIndex];
  const probabilities = new Map(snapshot.teams.map(team => [team.id, team.p]));
  const included = data.games.filter(game => probabilities.get(game.winnerId)[game.round] === 1 &&
    game.teamIds.filter(id => id !== game.winnerId).every(id => probabilities.get(id)[game.round] === 0));
  if (!included.length) return { label: 'Pre-tournament predictions', roundLabel: 'Pre-tournament', throughDate: null, partial: false, includedGames: 0, totalGames: data.games.length };
  const gameDay = game => new Date(game.date).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const throughDate = included.map(gameDay).sort().at(-1);
  const dayGames = data.games.filter(game => gameDay(game) === throughDate);
  const includedDay = included.filter(game => gameDay(game) === throughDate);
  const partial = includedDay.length !== dayGames.length;
  const date = new Date(`${throughDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
  return {
    label: partial ? `Includes ${includedDay.length} of ${dayGames.length} ${date} games` : `Predictions through ${date} games`,
    roundLabel: [...new Set(includedDay.map(game => game.roundName))].join(' / '),
    throughDate, partial, includedGames: included.length, totalGames: data.games.length,
  };
}
