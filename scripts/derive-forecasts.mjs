// Bart Torvik's published neutral-court log5 formula, followed by exact tree propagation.
export function pairwise(a, b) {
  if (![a, b].every(x => Number.isFinite(x) && x >= 0 && x <= 1)) {
    throw new RangeError('Ratings must be probabilities between 0 and 1.');
  }
  if (a === b) return 0.5;
  return a * (1 - b) / (a * (1 - b) + b * (1 - a));
}

export function propagate(tournament, ratings) {
  const strength = new Map(ratings.teams.map(t => [t.id, t.barthag]));
  if (strength.size !== 68 || tournament.teams.length !== 68 || tournament.teams.some(t => !strength.has(t.id))) {
    throw new Error('A tournament requires one rating for each of its 68 teams.');
  }
  if (new Set(tournament.regionOrder).size !== 4) throw new Error('Four distinct bracket regions are required.');
  const rows = new Map(tournament.teams.map(t => [t.id, {id: t.id, p: Array(7).fill(0), barthag: strength.get(t.id)}]));
  // Merge two independent sub-brackets. Every possible opponent contributes its probability.
  const merge = (left, right, round) => {
    const winners = new Map();
    for (const [own, other] of [[left, right], [right, left]]) {
      for (const [id, reached] of own) {
        const advance = reached * [...other].reduce((sum, [opp, chance]) => sum + chance * pairwise(strength.get(id), strength.get(opp)), 0);
        rows.get(id).p[round] = advance;
        winners.set(id, advance);
      }
    }
    return winners;
  };
  let firstFourSlots = 0;
  let layer = tournament.regionOrder.flatMap(region => Array.from({length: 16}, (_, slot) => {
    const teams = tournament.teams.filter(t => t.region === region && t.bracketSlot === slot);
    if (teams.length === 1) {
      rows.get(teams[0].id).p[0] = 1;
      return new Map([[teams[0].id, 1]]);
    }
    if (teams.length === 2 && teams.every(t => t.playIn)) {
      firstFourSlots++;
      return merge(new Map([[teams[0].id, 1]]), new Map([[teams[1].id, 1]]), 0);
    }
    throw new Error(`Invalid initial bracket slot: ${region}, ${slot}.`);
  }));
  if (firstFourSlots !== 4) throw new Error('Expected four First Four slots.');
  for (let round = 1; round <= 6; round++) {
    layer = Array.from({length: layer.length / 2}, (_, i) => merge(layer[2 * i], layer[2 * i + 1], round));
  }
  return [...rows.values()];
}

async function main() {
  const {readFile, writeFile, mkdir} = await import('node:fs/promises');
  const {resolve} = await import('node:path');
  const args = process.argv.slice(2);
  const option = key => {
    const at = args.indexOf(key);
    if (at === -1 || !args[at + 1]) throw new Error(`Required: ${key}`);
    return resolve(args[at + 1]);
  };
  const data = option('--data');
  const inputs = option('--ratings');
  const out = option('--out');
  await mkdir(out, {recursive: true});
  const results = [];
  for (const year of [2024, 2025, 2026]) {
    const tournament = JSON.parse(await readFile(`${data}/${year}.json`, 'utf8'));
    const ratings = JSON.parse(await readFile(`${inputs}/${year}-ratings.json`, 'utf8'));
    if (ratings.date >= tournament.firstGameDate.slice(0, 10)) throw new Error(`${year}: ratings must precede the tournament.`);
    const teams = propagate(tournament, ratings);
    const totals = Array.from({length: 7}, (_, i) => teams.reduce((sum, t) => sum + t.p[i], 0));
    if (totals.some((sum, i) => Math.abs(sum - [64,32,16,8,4,2,1][i]) > 1e-10)) throw new Error(`${year}: invalid probability totals.`);
    if (teams.some(t => t.p.some((p, i) => !Number.isFinite(p) || p < 0 || p > 1 || (i && p > t.p[i - 1] + 1e-12)))) throw new Error(`${year}: invalid cumulative probability.`);
    tournament.forecastProvider = 'T-Rank / log5 reconstruction';
    tournament.modelNote = 'Reconstructed here from the morning-after-Selection-Sunday T-Rank Barthag ratings using Bart Torvik’s documented neutral-court log5 formula. Exact bracket propagation averages over every possible opponent, including the First Four. Ratings are held fixed; no tournament results or later information enter these probabilities. This is not a forecast published by FiveThirtyEight or Bart Torvik, and it does not add matchup, injury, venue or rating-uncertainty adjustments.';
    tournament.forecastNote = `One reconstructed pre-tournament snapshot using ratings dated ${ratings.date}. Later results are shown separately; no daily forecast history is invented.`;
    tournament.forecasts = [{date: ratings.date, kind: 'reconstructed', provider: tournament.forecastProvider, teams}];
    tournament.sources.push(ratings.source);
    await writeFile(`${out}/${year}.json`, JSON.stringify(tournament) + '\n');
    const best = [...teams].sort((a,b) => b.p[6] - a.p[6]).slice(0,5).map(t => ({id: t.id, name: tournament.teams.find(x => x.id === t.id).name, championshipProbability: t.p[6]}));
    results.push({year, date: ratings.date, teams: teams.length, totals, topFive: best, source: ratings.source});
  }
  const index = JSON.parse(await readFile(`${data}/index.json`, 'utf8'));
  for (const year of index.competitions.mens.years.filter(y => y.year >= 2024)) {
    year.forecastDates = [results.find(r => r.year === year.year).date];
    year.forecastProvider = 'T-Rank / log5 reconstruction';
  }
  await writeFile(`${out}/index.json`, JSON.stringify(index, null, 2) + '\n');
  await writeFile(`${out}/derived-validation.json`, JSON.stringify({checks: ['Frozen ratings predate First Four', '68 distinct mapped teams', 'Four two-team First Four slots', 'Exact probability propagation across all possible opponents', 'Bounded finite monotonically decreasing cumulative probabilities', 'Seven round totals 64/32/16/8/4/2/1 within 1e-10'], years: results}, null, 2) + '\n');
  console.log(JSON.stringify(results.map(({year,date,totals,topFive}) => ({year,date,totals,topFive})), null, 2));
}

if (typeof process !== 'undefined' && process.argv[1]) {
  const {pathToFileURL} = await import('node:url');
  if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
}
