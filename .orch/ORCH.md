# Using orch in this repo

This repo is set up for **agent-orch**: it authors a change with one agent,
cross-audits it with a second, gates on tests, then merges into
`orch/integration` and opens or updates the persistent PR to `main`.
`main` is a GitHub mirror; update it locally only by fetching and
fast-forwarding `origin/main`.

If `main` requires PR review and orch opens the PR with the same bot identity
that later merges it, GitHub will not let that bot approve its own PR. Headless
self-merge therefore needs either a distinct reviewer identity that records an
approval, or a ruleset `bypass_actors` grant for the merging actor. With the
bypass path, GitHub review is bypassed; orch's author -> cross-audit ->
test-gate is the governing review.

## Commands
- `orch task "<change>" [roles]`   author → cross-audit → test-gate → merge
- `orch issue <number> [roles]`    fetch a GitHub issue as a work order, run the cycle, `Closes #<n>`
- `orch review <branch>`           audit an existing branch (no author)
- `orch continue <sid>`            resume an interrupted/stalled cycle from its checkpoint
- `orch pr <number> [--merge]`     review (and optionally merge) a GitHub PR
- `orch agent add <name>`          add an agent to the rotation pool
- `orch agent build <name> [--pr]` scaffold a missing adapter via orch's own pipeline
- `orch dashboard [--json] [--limit <n>] [--check-history]`
                                    live cycle status, log tail, run history, metrics
                                    (`--limit` caps history rows; `--check-history`
                                    shows stale red rows as resolved when branches are gone,
                                    view only — runs.jsonl is left unchanged)

A role is a spec `"<agent> [model] [effort]"`, e.g.
`--author "claude claude-opus-4-8 high" --reviewer "codex"`.
`--cheap` forces `orch.yml`'s `cheap.role` (e.g. a local llm) for one run;
set `cheap.paths` to auto-route matching `--file`/`orch issue` work orders.
`--config-file <path.yml>` layers a custom YAML file on top of `orch.yml` for one run.
Config and every option live in `.orch/orch.yml`.

Run `orch --help` for the full flag list.
