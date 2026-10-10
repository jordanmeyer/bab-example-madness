# Setup

Created a new isolated folder for this example; no existing student files were overwritten. This configured Mac already provides Apple Git 2.50.1, Node 22.19.0 at `/Users/jordan/.nvm/versions/node/v22.19.0/bin/node`, and npm 10.9.3. No software or global settings were installed or changed. `.node-version` records the tested Node version for local work and the prepared Pages workflow.

The managed starter uses Vite 8.3.4 and Apache ECharts 6.1.0. Dependency lifecycle scripts remain disabled by `.npmrc`. Initial installation used `npm install --cache /private/tmp/bab-madness-npm-cache`: 19 packages installed, 20 audited, and zero advisories reported. The plugin dependency checker passed. These are bounded observations, not a security certification. Subsequent reproducible installation uses `npm ci`; use the same temporary cache argument if the host cannot write the default npm cache.

Local Git attribution reuses the previously authorized course identity: Jordan Meyer <jordanmeyer@protonmail.com>. It will appear in history if published. Configuration is project-local. No remote is required for local history or preview.

## Verified local procedure

From the project root:

```sh
node tests/run.mjs
npm run test:browser -- --port 9741
```

The test server binds loopback and serves `http://127.0.0.1:9741/tests/`. It serves the project root so tests can import the actual model functions. The coordinating agent opened this browser test surface; numerical checks also passed through Node.

Production preview:

```sh
npm run build
npm run preview -- --port 9742
```

The preview binds loopback and serves `http://127.0.0.1:9742/bab-example-madness/`. Production output and desktop rendering were observed on this configured Mac. Local review measured 1439 and 727 CSS pixels. A later foreground live-site check established a genuine 375 × 900 CSS-pixel viewport, with no body overflow, a default table, keyboard horizontal scrolling, and team-to-region navigation. This is desktop browser emulation, not a physical phone/touch test. See EVALUATION.md for final browser coverage, tested commit, and process shutdown status rather than assuming the servers remain running.

The application makes no external runtime requests for its data or fonts. Downloading original datasets is a separate maintainer activity described in `data-preparation/README.md`; those optional Python utilities are not a student or visitor prerequisite. No clean-machine macOS, Windows, or novice-user setup claim is made.
