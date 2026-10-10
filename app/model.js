export const STAGES = ['Round of 64', 'Round of 32', 'Sweet 16', 'Elite Eight', 'Final Four', 'Final', 'Champion'];
export const SHORT_STAGES = ['64', '32', '16', '8', '4', '2', '1'];

export function probabilityLabel(p) {
  if (p == null || !Number.isFinite(p)) return '—';
  if (p === 0) return '—';
  if (p === 1) return '✓';
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

export function teamHistory(data, teamId) {
  return (data.forecasts ?? []).map((snapshot, index) => ({ date: snapshot.date, index, p: probabilitiesFor(data, index, teamId) }));
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
