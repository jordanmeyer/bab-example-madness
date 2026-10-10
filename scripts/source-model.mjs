// Inverse bracket model: recover one conservative matchup matrix from published
// advancement marginals, then condition that fixed matrix on completed games.
export const sigmoid = x => 1 / (1 + Math.exp(-x));
export function logit(p) {
  p = Math.max(1e-8, Math.min(1 - 1e-8, p));
  return Math.log(p / (1-p));
}
const sum = values => values.reduce((a, b) => a + b, 0);
export const easternDay = date => new Date(date).toLocaleDateString('en-CA', {timeZone: 'America/New_York'});

export function bracketTree(data) {
  const leaf = id => ({ids: [id], round: -1});
  const merge = (left, right, round) => ({left, right, round, ids: [...left.ids, ...right.ids]});
  let layer = data.regionOrder.flatMap(region => Array.from({length: 16}, (_, slot) => {
    const teams = data.teams.filter(t => t.region === region && t.bracketSlot === slot);
    if (teams.length === 1) return leaf(teams[0].id);
    if (teams.length === 2 && teams.every(t => t.playIn)) return merge(leaf(teams[0].id), leaf(teams[1].id), 0);
    throw new Error(`Invalid bracket slot ${region}/${slot}`);
  }));
  for (let round = 1; round <= 6; round++) layer = Array.from({length: layer.length / 2}, (_, i) => merge(layer[2*i], layer[2*i+1], round));
  return layer[0];
}

export function propagate(tree, matchup, completed = []) {
  const rows = new Map(tree.ids.map(id => [id, {id, p: Array(7).fill(0), alive: true}]));
  const visit = node => {
    if (node.round < 0) {
      rows.get(node.ids[0]).p[0] = 1;
      return new Map([[node.ids[0], 1]]);
    }
    const left = visit(node.left), right = visit(node.right);
    const game = completed.find(g => g.round === node.round && node.left.ids.includes(g.teamIds[0]) !== node.left.ids.includes(g.teamIds[1]) && g.teamIds.every(id => node.ids.includes(id)));
    if (game) {
      for (const id of node.ids) {
        rows.get(id).p[node.round] = Number(id === game.winnerId);
        if (id !== game.winnerId) rows.get(id).alive = false;
      }
      return new Map([[game.winnerId, 1]]);
    }
    const winners = new Map(node.ids.map(id => [id, 0]));
    for (const [a, pa] of left) for (const [b, pb] of right) {
      const q = matchup(a, b);
      if (!Number.isFinite(q) || q < 0 || q > 1) throw new Error(`Missing/invalid matchup ${a}/${b}`);
      winners.set(a, winners.get(a) + pa * pb * q);
      winners.set(b, winners.get(b) + pa * pb * (1-q));
    }
    for (const [id, p] of winners) rows.get(id).p[node.round] = p;
    return winners;
  };
  visit(tree);
  return [...rows.values()];
}

// At each node, independent child winner distributions weight a matrix of
// Bernoulli games. Maximum entropy chooses q(i,j)=sigmoid(u_i-u_j), with
// node-specific scores fitted to the source's advancement marginals. It is not
// a recovery of the publisher's private ratings or an outcome-trained fit.
export function reconstruct(tree, observations) {
  const observed = new Map(observations.map(t => [t.id, t.p]));
  if (tree.ids.some(id => !observed.has(id))) throw new Error('Complete field required for inverse model');
  const matrix = {}, diagnostics = [];
  const visit = node => {
    if (node.round < 0) return new Map([[node.ids[0], 1]]);
    const left = visit(node.left), right = visit(node.right);
    const ids = node.ids, n = ids.length, split = node.left.ids.length;
    const reach = ids.map(id => left.get(id) ?? right.get(id));
    let target = ids.map(id => observed.get(id)[node.round]);
    if (node.round === 0 && target.some(p => p == null)) {
      // With no published First Four column, equal next-round strength is the
      // explicit identification assumption: divide their R32 probabilities.
      target = ids.map(id => Math.max(1e-8, observed.get(id)[1]));
    }
    if (target.some(p => p == null || !Number.isFinite(p))) throw new Error('Missing advancement input');
    target = target.map(p => Math.max(1e-10, p));
    const total = sum(target);
    target = target.map(p => p/total);
    const scores = Array(n).fill(0);
    let residual = Infinity, iteration = 0;
    for (; iteration < 1500; iteration++) {
      residual = 0;
      for (let i = 0; i < n; i++) {
        let predicted = 0, curvature = 1e-10;
        const start = i < split ? split : 0, end = i < split ? n : split;
        for (let j = start; j < end; j++) {
          const q = sigmoid(scores[i]-scores[j]), weight = reach[i]*reach[j];
          predicted += weight*q;
          curvature += weight*q*(1-q);
        }
        const error = predicted-target[i];
        residual = Math.max(residual, Math.abs(error));
        scores[i] -= Math.max(-1, Math.min(1, (error+1e-10*scores[i])/curvature));
      }
      const center = sum(scores)/n;
      for (let i = 0; i < n; i++) scores[i] -= center;
      if (residual < 1e-8) break;
    }
    const winners = new Map(ids.map(id => [id, 0]));
    for (let i = 0; i < split; i++) for (let j = split; j < n; j++) {
      const q = Math.max(1e-10, Math.min(1-1e-10, sigmoid(scores[i]-scores[j])));
      matrix[`${ids[i]}:${ids[j]}`] = q;
      matrix[`${ids[j]}:${ids[i]}`] = 1-q;
      winners.set(ids[i], winners.get(ids[i])+reach[i]*reach[j]*q);
      winners.set(ids[j], winners.get(ids[j])+reach[i]*reach[j]*(1-q));
    }
    diagnostics.push({round: node.round, teams: n, residual, iterations: iteration+1});
    return winners;
  };
  visit(tree);
  const rows = propagate(tree, (a,b) => matrix[`${a}:${b}`]);
  const errors = rows.flatMap(t => t.p.flatMap((p, stage) => observed.get(t.id)[stage] == null ? [] : [Math.abs(p-observed.get(t.id)[stage])]));
  return {matrix, fit: {maxError: Math.max(...errors), meanError: sum(errors)/errors.length, maxNodeResidual: Math.max(...diagnostics.map(d => d.residual)), diagnostics}};
}

export function timeline(data, matrix, openingDate) {
  const tree = bracketTree(data);
  const dates = [...new Set([openingDate, ...data.games.map(g => easternDay(g.date))])].sort();
  return dates.map(date => ({date, kind: 'reconstructed', teams: propagate(tree, (a,b) => matrix[`${a}:${b}`], date === openingDate ? [] : data.games.filter(g => easternDay(g.date) <= date))}));
}

// No intercept: reversing the two teams must complement the prediction.
// Ridge penalty keeps highly correlated sources from acquiring extreme weights.
export function fitLogistic(samples, dimensions, ridge = 0.02) {
  if (!samples.length) throw new Error('Prior games required');
  const weights = Array(dimensions).fill(1/dimensions);
  for (let iteration=0; iteration<2000; iteration++) {
    let largest=0;
    for (let k=0; k<dimensions; k++) {
      let gradient=ridge*(weights[k]-1/dimensions), curvature=ridge;
      for (const {x, y, weight=1/samples.length} of samples) {
        const p=sigmoid(sum(x.map((v,i)=>v*weights[i])));
        gradient += weight*(p-y)*x[k];
        curvature += weight*p*(1-p)*x[k]*x[k];
      }
      const step=gradient/curvature;
      weights[k]-=step;
      largest=Math.max(largest,Math.abs(step));
    }
    if(largest<1e-9) break;
  }
  return weights;
}
export const predict = (weights, probabilities) => sigmoid(sum(weights.map((w,i)=>w*logit(probabilities[i]))));
export const scores = pairs => ({games:pairs.length, brier:sum(pairs.map(([p,y])=>(p-y)**2))/pairs.length, logLoss:sum(pairs.map(([p,y])=>-Math.log(Math.max(1e-12,y?p:1-p))))/pairs.length});
