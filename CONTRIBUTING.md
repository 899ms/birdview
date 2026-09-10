# Documentation maintenance

[中文](CONTRIBUTING.zh.md)

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
