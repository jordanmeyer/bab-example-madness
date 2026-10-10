import { readFile } from 'node:fs/promises';
import * as model from '../app/model.js';
import { runChecks } from './cases.js';
const results = await runChecks(name => readFile(new URL(`../app/public/data/${name}`, import.meta.url), 'utf8').then(JSON.parse), model);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name}${r.error ? ': ' + r.error : ''}`);
console.log(`${results.filter(r => r.pass).length}/${results.length} checks passed`);
if (results.some(r => !r.pass)) process.exitCode = 1;
