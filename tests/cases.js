import { pairwise, propagate } from '../scripts/derive-forecasts.mjs';
// Independent facts below were read from the archived source CSVs and NCAA title records.
export async function runChecks(load, model = {}) {
  const reports = [];
  const check = (name, fn) => { try { fn(); reports.push({ name, pass: true }); } catch (error) { reports.push({ name, pass: false, error: error.message }); } };
  const assert = (value, message) => { if (!value) throw Error(message); };
  const close = (actual, expected, tolerance = 1e-9) => assert(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
  const index = await load('index.json');
  const seasons = await Promise.all(index.years.map(({ file }) => load(file)));
  check('Every year 2016–2026 is available once', () => assert(index.years.map(x => x.year).join() === '2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026', 'Year coverage differs'));
  const expectedChampions = {2016:'222',2017:'153',2018:'222',2019:'258',2021:'239',2022:'2305',2023:'41',2024:'41',2025:'57',2026:'130'};
  for (const d of seasons) {
    if (d.year === 2020) {
      check('2020 cancellation has no invented field, games or probabilities', () => assert(d.status === 'cancelled' && !d.teams.length && !d.games.length && !d.forecasts.length, 'Cancelled season contains tournament data'));
      continue;
    }
    const ids = new Set(d.teams.map(t => t.id));
    check(`${d.year}: complete field and round structure`, () => {
      assert(ids.size === 68 && d.teams.length === 68 && d.games.length === 67, 'Incorrect field size');
      assert(new Set(d.games.map(g => g.id)).size === 67, 'Duplicate game ID');
      assert([0,1,2,3,4,5,6].map(r => d.games.filter(g => g.round === r).length).join() === '4,32,16,8,4,2,1', 'Incorrect round counts');
      for (const region of d.regionOrder) {
        const slots = d.teams.filter(t => t.region === region).map(t => t.bracketSlot);
        assert(new Set(slots).size === 16 && slots.every(s => Number.isInteger(s) && s >= 0 && s < 16), `Invalid slots in ${region}`);
      }
    });
    check(`${d.year}: winners advance through correct regional/semifinal topology`, () => {
      for (const g of d.games) {
        assert(g.teamIds.length === 2 && new Set(g.teamIds).size === 2 && g.teamIds.every(id => ids.has(id)), `Invalid contestants: ${g.id}`);
        assert(g.teamIds.includes(g.winnerId), `Invalid winner: ${g.id}`);
        if (g.round < 6) {
          const next = d.games.find(n => n.id === g.nextGameId);
          assert(next?.round === g.round + 1 && next.teamIds.includes(g.winnerId), `Broken progression: ${g.id}`);
          if (g.round < 4) assert(g.region === next.region, `Region crossing: ${g.id}`);
        }
        if (g.status === 'final') assert(g.scores[g.teamIds.indexOf(g.winnerId)] > g.scores[1-g.teamIds.indexOf(g.winnerId)], `Winner contradicts score: ${g.id}`);
      }
      const pairs = d.games.filter(g => g.round === 5).map(g => g.teamIds.map(id => d.teams.find(t => t.id === id).region).sort().join());
      assert(d.finalFourPairs.every(pair => pairs.includes([...pair].sort().join())), 'Incorrect semifinal pairings');
    });
    check(`${d.year}: champion matches independent title record`, () => assert(d.games.find(g => g.round === 6).winnerId === expectedChampions[d.year] && d.championTeamId === expectedChampions[d.year], 'Champion mismatch'));
    if (d.forecasts.length) {
      check(`${d.year}: probabilities are complete, bounded and cumulative`, () => {
        const dates = d.forecasts.map(s => s.date);
        assert(new Set(dates).size === dates.length && dates.join() === [...dates].sort().join(), 'Snapshot ordering');
        for (const s of d.forecasts) {
          assert(s.teams.length === 68 && new Set(s.teams.map(t => t.id)).size === 68, `Incomplete snapshot ${s.date}`);
          for (const t of s.teams) {
            assert(ids.has(t.id) && t.p.length === 7, `Missing team/round ${t.id}`);
            assert(t.p.every((p,i) => Number.isFinite(p) && p >= 0 && p <= 1 && (!i || p <= t.p[i-1] + 1e-10)), `Invalid probability ${s.date}/${t.id}`);
          }
          [64,32,16,8,4,2,1].forEach((n,r) => close(s.teams.reduce((sum,t) => sum+t.p[r],0),n,0.000002));
        }
      });
      check(`${d.year}: First Four shares one Round-of-64 berth`, () => {
        for (const g of d.games.filter(g => g.round === 0)) {
          const team = d.teams.find(t => t.id === g.teamIds[0]);
          assert(d.teams.find(t => t.id === g.teamIds[1]).bracketSlot === team.bracketSlot, 'Play-in teams do not share slot');
          for (const s of d.forecasts) close(s.teams.filter(t => g.teamIds.includes(t.id)).reduce((sum,t) => sum+t.p[0],0),1,1e-7);
        }
      });
    }
  }
  const season = year => seasons.find(d => d.year === year);
  const p = (year,date,id) => season(year).forecasts.find(s => s.date === date).teams.find(t => t.id === id).p;
  check('2016 Kansas source probabilities retain exact precision', () => { close(p(2016,'2016-03-14','2305')[1],0.99027066); close(p(2016,'2016-03-14','2305')[6],0.19203143); close(p(2016,'2016-04-02','2305')[6],0); });
  check('2018 Villanova initial and post-semifinal title probabilities match source', () => { close(p(2018,'2018-03-12','222')[6],0.179788104721); close(p(2018,'2018-03-31','222')[6],0.644389873381); });
  check('2021 Gonzaga initial and post-semifinal probabilities match source', () => { close(p(2021,'2021-03-14','2250')[6],0.281433472751); close(p(2021,'2021-04-03','2250')[6],0.554514409875); });
  check('2023 Houston initial favorite becomes eliminated in archived history', () => { close(p(2023,'2023-03-12','248')[6],0.22085016963); close(p(2023,'2023-04-01','248')[6],0); });
  check('2021 Oregon–VCU is advancement without an invented score', () => {
    const g = season(2021).games.find(g => g.status === 'no-contest');
    assert(g?.winnerId === '2483' && g.scores.every(s => s === null), 'No-contest incorrectly encoded');
  });
  check('2018 LIU seed correction retains its real First Four slot', () => {
    const t = season(2018).teams.find(t => t.id === '6446');
    assert(t?.seed === 16 && t.region === 'East' && t.bracketSlot === 1, 'LIU correction mismatch');
  });
  if (model.probabilityLabel) {
    check('Small probability labels use strict percentage thresholds without changing zero or certainty', () => {
      for (const [value, label] of [[0, '—'], [0.0000001, '<0.01%'], [0.000099999, '<0.01%'], [0.0001, '<0.1%'], [0.000999999, '<0.1%'], [0.001, '<1%'], [0.009999999, '<1%'], [0.01, '1%'], [1, '✓']]) {
        assert(model.probabilityLabel(value) === label, `${value * 100}% should display ${label}`);
      }
    });
    check('Formatting never turns uncertain values into certainty or elimination', () => {
      assert(model.probabilityLabel(0.00001) !== model.probabilityLabel(0), 'Small probability hidden');
      assert(model.probabilityLabel(0.99999) !== model.probabilityLabel(1), 'Uncertain value appears certain');
    });
  }
  if (model.exactProbability) {
    check('Real tiny 2021 title chances stay nonzero in accessible percentages', () => {
      for (const id of ['198', '2413']) {
        const chance = p(2021, '2021-03-14', id)[6];
        assert(chance > 0 && chance < 0.00001, 'Source example must be a tiny nonzero chance');
        assert(model.exactProbability(chance) === '<0.001%', 'Accessible value falsely reports elimination');
        assert(model.exactProbability(chance) !== model.exactProbability(0), 'Tiny chance is indistinguishable from zero');
      }
    });
    check('Near certainty stays distinct from an achieved stage without extending ordinary precision', () => {
      assert(model.exactProbability(1 - 2.605881e-6) === '>99.999%', 'Near certainty falsely reports 100%');
      assert(model.exactProbability(1) === '100%' && model.exactProbability(0) === '0%', 'True endpoints changed');
      assert(model.exactProbability(0.22085016963) === '22.085%', 'Ordinary percentages should remain readable');
    });
  }
  if (model.resolvedTeam) {
    check('An initial favorite is not a known regional winner', () => {
      assert(model.resolvedTeam(season(2016),'South',4,0,0,'forecast') === null, 'Future regional winner leaked');
      assert(model.resolvedTeam(season(2016),'South',4,0,0,'results')?.id === '222', 'Actual regional winner missing');
    });
    check('First regional branch contains seeds1/16/8/9 including play-in contenders', () => {
      const seeds=model.bracketCandidates(season(2016),'East',2,0).map(t=>t.seed);
      assert(seeds.every(s=>[1,16,8,9].includes(s)) && new Set(seeds).size===4, 'Wrong branch topology');
    });
    check('Result paths distinguish champion from no-contest advancement', () => {
      assert(model.resultPath(season(2016),'222').join()==='1,1,1,1,1,1,1','Champion progression');
      assert(model.resultPath(season(2021),'2483').join()==='1,1,1,0,0,0,0','Oregon progression');
    });
    check('Probability sorting uses precision hidden by whole-percent labels', () => {
      const teams=[{id:'a',name:'A'},{id:'b',name:'B'}];
      const snapshot={teams:[{id:'a',p:[0.492]},{id:'b',p:[0.493]}]};
      assert(model.probabilityLabel(0.492)===model.probabilityLabel(0.493),'Fixture must have same displayed percent');
      assert(model.sortTeams(teams,snapshot,{key:'p0',direction:-1})[0].id==='b','Sort rounded labels instead of numbers');
    });
  }
  if (model.snapshotDay && model.nearestSnapshot) {
    check('Replay preserves real calendar gaps instead of equal snapshot spacing', () => {
      const forecasts=season(2023).forecasts, day=model.snapshotDay;
      assert(day('2023-04-01')-day('2023-03-26')===6, 'Six-day gap compressed');
      assert(day('2023-03-26')-day('2023-03-25')===1, 'Ordinary daily interval changed');
      assert(day(forecasts.at(-1).date)-day(forecasts[0].date)===20, 'Tournament calendar extent changed');
    });
    check('Replay snaps unavailable dates to a genuine forecast and handles one-snapshot years', () => {
      const forecasts=season(2023).forecasts;
      assert(forecasts[model.nearestSnapshot(forecasts,model.snapshotDay('2023-03-20'))].date==='2023-03-19', 'Invented or wrong snapshot in gap');
      assert(forecasts[model.nearestSnapshot(forecasts,model.snapshotDay('2023-03-30'))].date==='2023-04-01', 'Wrong side of long gap');
      assert(model.nearestSnapshot(season(2026).forecasts,model.snapshotDay('2026-04-01'))===0, 'Single reconstruction lost');
    });
  }
  check('Every played season has complete, unambiguous canonical bracket labels', () => {
    for (const d of seasons.filter(d => d.status === 'played')) {
      for (const field of ['bracketName', 'superShortName']) {
        assert(d.teams.every(team => typeof team[field] === 'string' && team[field].trim()), `${d.year}: missing ${field}`);
        assert(new Set(d.teams.map(team => team[field])).size === 68, `${d.year}: ambiguous ${field}`);
      }
      for (const game of d.games.filter(game => game.round === 0)) {
        const labels = game.teamIds.map(id => d.teams.find(team => team.id === id).superShortName);
        assert(labels[0] !== labels[1], `${d.year}: indistinguishable First Four entrants`);
      }
    }
    assert(season(2016).teams.find(team => team.id === '2031').bracketName === 'Little Rock', 'Historical school alias lost');
    assert(season(2018).teams.find(team => team.id === '6446').bracketName === 'LIU Brooklyn', 'Historical LIU identity lost');
  });
  if (model.unresolvedStages && model.lostAtStage && model.resultStatus) {
    check('A late forecast traces only uncertain rounds, never completed or eliminated stages', () => {
      assert(model.unresolvedStages([1,1,1,.75,.4,.2,.1]).join() === '3,4,5,6', 'Completed rounds get route bands');
      assert(model.unresolvedStages([1,1,1,0,0,0,0]).length === 0, 'Eliminated route remains');
      assert(model.unresolvedStages([1,1,1,1,1,1,1]).length === 0, 'Champion gets a probability band');
    });
    check('Only the strip for the game a team lost is grey; center status follows that team', () => {
      const houston = model.resultPath(season(2023), '248');
      assert(houston.map((_, stage) => model.lostAtStage(houston, stage)).join() === 'false,false,true,false,false,false,false', 'All Houston wins incorrectly greyed');
      assert(model.resultStatus(houston) === 'Eliminated in Sweet 16', 'Houston assigned a champion identity');
      assert(model.resultStatus(model.resultPath(season(2023), '41')) === 'Winner', 'UConn champion status');
      assert(model.resultStatus(model.resultPath(season(2023), '2640')) === 'Eliminated in First Four', 'First Four loss is a Round-of-64 appearance');
    });
  }
  if (model.snapshotStatus) {
    check('Snapshot status comes from included game outcomes, not merely the calendar date', () => {
      const d = season(2023);
      const first = model.snapshotStatus(d, 0);
      assert(first.throughDate === null && first.includedGames === 0 && first.roundLabel === 'Pre-tournament', 'Invented initial results');
      const march16 = model.snapshotStatus(d, d.forecasts.findIndex(s => s.date === '2023-03-16'));
      assert(march16.includedGames === 20 && march16.label === 'Predictions through March 16 games' && march16.roundLabel === 'Round of 64', 'First full game day described incorrectly');
      const last = model.snapshotStatus(d, d.forecasts.length - 1);
      assert(last.includedGames === 66 && last.totalGames === 67 && last.throughDate === '2023-04-01' && last.roundLabel === 'Final Four', 'Final result leaks into archived forecast');
    });
    check('All 83 archived snapshots accurately identify complete game days, including the 2021 no-contest', () => {
      let count = 0;
      for (const d of seasons.filter(d => d.year <= 2023 && d.status === 'played')) {
        d.forecasts.forEach((snapshot, index) => {
          const status = model.snapshotStatus(d, index); count++;
          assert(!status.partial && status.throughDate === (index ? snapshot.date : null), `${d.year}/${snapshot.date}: incorrect through-games date`);
        });
        assert(model.snapshotStatus(d, d.forecasts.length - 1).includedGames === 66, `${d.year}: archive should stop before final`);
      }
      assert(count === 83, 'Archived snapshot coverage changed');
      const d = season(2021), status = model.snapshotStatus(d, d.forecasts.findIndex(s => s.date === '2021-03-20'));
      assert(status.includedGames === 36, 'Oregon advancement omitted or turned into an extra played game');
    });
    check('An explicitly partial same-day snapshot reports its coverage without claiming a timestamp', () => {
      const d = structuredClone(season(2023)), initial = d.forecasts[0], partial = d.forecasts[1];
      const game = d.games.find(game => game.id === '401522116');
      // One of the two March 14 Eastern-time First Four games remains unresolved.
      for (const id of game.teamIds) partial.teams.find(team => team.id === id).p = initial.teams.find(team => team.id === id).p;
      const status = model.snapshotStatus(d, 1);
      assert(status.partial && status.includedGames === 1 && status.label === 'Includes 1 of 2 March 14 games', 'Partial day falsely presented as a completed day');
    });
  }
  check('Log5 known answers, symmetry and complementarity', () => {
    close(pairwise(0.8,0.2),16/17); close(pairwise(0.8,0.5),0.8); close(pairwise(0.9,0.9),0.5);
    close(pairwise(0.7,0.3)+pairwise(0.3,0.7),1);
  });
  check('Equal-strength bracket gives exact fair-coin advancement for ordinary and First Four teams', () => {
    const d=season(2024), ratings={teams:d.teams.map(t=>({id:t.id,barthag:0.5}))};
    for(const row of propagate(d,ratings)) {
      const playIn=d.teams.find(t=>t.id===row.id).playIn;
      row.p.forEach((p,r)=>close(p,2**(-r-(playIn?1:0))));
    }
  });
  check('One stronger team has a hand-calculated probability through all possible opponents', () => {
    const d=season(2024), target=d.teams.find(t=>t.seed===1 && !t.playIn);
    const ratings={teams:d.teams.map(t=>({id:t.id,barthag:t.id===target.id?0.8:0.5}))};
    propagate(d,ratings).find(t=>t.id===target.id).p.forEach((p,r)=>close(p,0.8**r));
    const playIn=d.teams.find(t=>t.playIn);
    ratings.teams.forEach(t=>t.barthag=t.id===playIn.id?0.8:0.5);
    propagate(d,ratings).find(t=>t.id===playIn.id).p.forEach((p,r)=>close(p,0.8**(r+1)));
  });
  check('Reconstructed forecasts cannot read known game results', () => {
    const d=season(2024), ratings={teams:d.teams.map(t=>({id:t.id,barthag:0.5}))};
    const before=propagate(d,ratings);
    const withoutResults={teams:d.teams,regionOrder:d.regionOrder};
    assert(JSON.stringify(before)===JSON.stringify(propagate(withoutResults,ratings)),'Known results influence forecast');
  });
  for(const year of [2024,2025,2026]) {
    check(`${year}: reconstruction is a single pre-tournament snapshot with distinct attribution`, () => {
      const d=season(year);
      assert(d.forecasts.length===1 && d.forecasts[0].kind==='reconstructed' && d.forecasts[0].date<d.firstGameDate.slice(0,10),'Invalid reconstruction date/type');
      assert(d.forecastProvider.includes('log5') && d.modelNote.includes('fixed'),'Missing model distinction');
    });
  }
  return reports;
}
