# Contribution Guidelines

[中文](CONTRIBUTING.zh.md)

## Development and pull requests

Use Node.js 18 or newer. Fork the repository on GitHub, work in a focused branch in your fork, then open a PR against the upstream default branch. For substantial features, discuss the problem in an issue first. Bug reports should include reproducible steps and sanitized inputs.

```sh
npm ci
npm run typecheck
npm run check:build
npm test
npm run validate:examples
node scripts/check-docs.mjs
```

For viewer or renderer changes, run `npm run build:demo` and review the tracked demo diff. Verify Chinese and English, desktop and mobile, and the affected interactions. Optional Playwright checks are listed in the [release checklist](docs/releasing.md). Add regression coverage for behavior changes; describe checks actually run and any remaining limitations in the PR template. Never include private source data or credentials.

CI checks Windows and Linux on Node.js 18 and 24, validates documentation and examples, and verifies the tracked demo matches renderer output. Contributions are distributed under the repository's [MIT License](LICENSE); preserve [third-party notices](THIRD_PARTY_NOTICES).

## TypeScript migration

Structural contracts are maintained in `src/contracts/models.mts` with TypeBox, which also infers their TypeScript types. `npm run build` emits the runtime modules and regenerates `schemas/*.schema.json`; do not edit those exchange files directly. Ajv remains the runtime validator, with cross-record checks maintained in `src/validate.mts` and emitted to `scripts/validate.mjs`. The frozen schemas in `test/fixtures/contracts-v1/` are pre-migration test baselines, not a second source of truth; do not regenerate them to silence parity failures. `npm run typecheck` also checks narrowing and invalid-type cases, and `check:build` verifies generated schemas. See the [migration work plan](docs/typescript-migration.md) for phase status and remaining work.

The project-mode CLI and HTML renderer are maintained in `src/birdview.mts` and `src/render.mts`; run `npm run build` after editing. Strict TypeScript targets Node.js 18-compatible ESM and emits the existing `scripts/*.mjs` command paths. Distribute generated files with their sources so skill users do not need to compile. CI checks types and compares a temporary clean build with distributed JavaScript. Do not edit generated files directly. The renderer's temporary declaration has been removed; external architecture JSON still requires runtime validation. Browser scripts remain JavaScript until migrated separately.

Repository checks are also maintained in `src/check-docs.mts` and `src/check-build.mts`; regenerate their distributed scripts with `npm run build`. `npm test` compiles TypeScript tests into the ignored `.test-build/` directory before running them alongside remaining JavaScript tests. The committed build checker can verify a clean checkout without first overwriting the artifacts it checks.

Browser routing is maintained in `src/viewer/routing.mts`, checked separately by `tsconfig.viewer.json` without Node globals. `npm run build` uses pinned esbuild to emit an ESM module for direct tests and a self-contained `assets/architecture-routing.js` bundle for the legacy viewer. `npm run check:build` checks both outputs. Do not edit generated routing files or the frozen `test/fixtures/routing-v1.js` parity baseline. CSS, HTML and routing geometry are unchanged by this migration; compare visual output before changing this boundary. Remaining browser modules are still JavaScript.

Translation core is maintained in `src/viewer/i18n.mts`: catalog, available-language discovery, selection precedence and localized field fallback. The generated `assets/architecture-i18n-core.js` is embedded before the existing DOM adapter; edit `assets/architecture-i18n.js` only for its remaining DOM integration. `test/fixtures/i18n-v1.js` is a frozen compatibility reference, not maintained runtime code. The i18n ESM and IIFE outputs follow the same build/check workflow as routing and are distributed with source.

## Commit rules

- Do not run `git add`, `git commit`, `git push`, create branches or rewrite history without an explicit user request.
- Use Conventional Commit titles in the format `type(scope): 中文说明 / English summary`.
- Each commit must contain one logically consistent set of changes. Stage and commit different kinds of changes separately.
- Do not commit local state or temporary build artifacts; follow each directory's `.gitignore`. Distributed JavaScript generated from `src/` under `scripts/`, browser bundles `assets/architecture-routing.js` and `assets/architecture-i18n-core.js`, and generated exchange schemas under `schemas/` are intentional exceptions and must accompany changes to their TypeScript source. Do not commit `.test-build/`.
- Before committing, inspect the staged diff and exclude unrelated files, generated artifacts, debug output and unexplained formatting.

## Documentation maintenance

- Pair English `name.md` with Chinese `name.zh.md` in the same directory, with reciprocal links below the first heading. Prefer same-language references; avoid mixed-language prose.
- Keep both versions equivalent, including examples, constraints and limitations. Preserve identifiers, commands, data paths and enums. Edit/review both together, not a summary translation.
- User instructions take precedence. Resolve discrepancies against implementation and authorized requirements, then fix both versions; neither language overrides the other.
- `SKILL.md` alone retains executable frontmatter (`name`, `description`); `SKILL.zh.md` is a reading companion, not another registration.
- Pair new owned Markdown in the root, `references/`, `docs/` and `examples/`. Add new owned directories to the checker; exclude dependencies and generated output.

## Verify and record

```sh
node scripts/check-docs.mjs
```

Checks pairs, language links, local Markdown links and changes since confirmation. `docs/i18n.json` stores SHA-256 hashes with CRLF normalized to LF; hashes cannot verify translation accuracy.

Only after reviewing both versions, refresh and commit the record with the paired files:

```sh
node scripts/check-docs.mjs --update
```

Never refresh hashes merely to silence a failure.
