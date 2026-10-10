// Include local font and installed package notices in the website; never publish node_modules.
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const sections = await Promise.all(['ebgaramond-license.txt', 'opensans-license.txt']
  .map(name => readFile(`app/theme/fonts/${name}`, 'utf8')));
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path || entry.dev) continue;
  if (!path.startsWith('node_modules/') || entry.link) throw Error(`Non-registry dependency: ${path}`);
  let names;
  try { names = await readdir(path); }
  catch (error) { if (error.code === 'ENOENT' && entry.optional) continue; throw error; }
  const notices = names.filter(name => /^(licen[sc]e|copying|notice)([.-]|$)/i.test(name)).sort();
  if (!notices.length) {
    const supplemental = `licenses/${path.slice(13).replaceAll('/', '__')}@${entry.version}.txt`;
    sections.push(`${path.slice(13)} @ ${entry.version}\n` + await readFile(supplemental, 'utf8'));
    continue;
  }
  sections.push(`${path.slice(13)} @ ${entry.version}
${entry.license || 'See notice'}
` +
    (await Promise.all(notices.map(name => readFile(join(path, name), 'utf8')))).join('\n'));
}
await mkdir('app/public', { recursive: true });
await writeFile('app/public/THIRD-PARTY-NOTICES.txt', sections.join('\n\n--------\n\n').split('\n').map(line => line.trimEnd()).join('\n').trimEnd() + '\n');
console.log(`Retained ${sections.length} font/package notice sections.`);
