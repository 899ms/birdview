# Birdview 0.1.0 Release Notes

[中文](release-notes-0.1.0.zh.md)

Draft for the first release; this file does not indicate that a tag or release has been published.

Birdview makes planned AI code changes visible on an evidence-linked architecture map before editing.

## Included

- Standalone HTML with architecture, changes and side-by-side comparison views.
- Module evidence, dependencies, activity history, zoom, a guided tour and a single-screen workspace.
- Chinese and English controls and paired documentation.
- Schema and semantic validation, stable module identities, role colors and explicit justification for generic classifications.
- Auto and on-demand activation modes. Auto is the distribution default; explicit project settings take precedence.
- MIT licensing and GitHub contribution templates.

## Installation

Requires Node.js 18 or newer. Follow the [installation guide](installation.md) for skill placement, dependencies, verification and mode selection. The package is not published to npm.

## Verification before publishing

Run the [release checklist](releasing.md) against the exact release candidate. Record actual test results and any skipped browser checks in the published notes; CI status alone does not verify agent activation.

## Known limitations

Activity is declared by the agent, not independently observed. Mode instructions cannot enforce model compliance. Map updates require HTML regeneration and browser refresh; no live transport or display acknowledgements are implemented. A completed event does not prove verification succeeded. Included examples are fictional, not evidence about this repository or a production system.
