# Documentation maintenance

[中文](CONTRIBUTING.zh.md)

## Language pairs

Repository-owned Markdown uses English `name.md` and Chinese `name.zh.md` in
the same directory. Put a reciprocal language link below the first heading.
Translate the complete meaning, examples, constraints and limitations; do not
replace a translation with a summary. Prefer same-language links to paired guides.
Keep code identifiers, commands, data paths and enum values unchanged.

`SKILL.md` remains the executable skill entry with its existing frontmatter.
`SKILL.zh.md` translates the instructions for readers and is not a second skill
registration. Keep the canonical `name` and `description` in `SKILL.md` only.
The language-link text is the only deliberate bilingual navigation on each page.

## Synchronization

Both languages must express the same requirements. Edit and review both in the
same change, including reciprocal links and references. User instructions take
precedence over either version. Resolve discrepancies from implementation and
the authorized requirement, then correct both versions rather than silently
choosing a language as more authoritative.

`docs/i18n.json` records SHA-256 hashes of each file at the last confirmed
consistent state. Hashes normalize CRLF to LF for Windows checkouts. Run:

```sh
node scripts/check-docs.mjs
```

Only after checking both translations, refresh the record with:

```sh
node scripts/check-docs.mjs --update
```

Commit paired documents and the updated record together. The check finds missing
pairs, missing language links, broken local Markdown links, and changed content
since confirmation. It cannot judge translation accuracy. Do not refresh hashes
merely to silence a failure. Dependencies and generated output are outside this
documentation policy. New owned Markdown in the root, `references/`, `docs/`, or
`examples/` requires a pair; update the check's directory scope if adding another
owned documentation directory.
