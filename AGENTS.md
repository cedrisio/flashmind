# AGENTS.md

AGENTS.md is the hard instruction file for AI agents and operators working in this repo.
It is the source of truth for branch discipline, release flow, and remote push rules.
For the detailed workflow, see [docs/BRANCHING.md](docs/BRANCHING.md).

## Atlas scope (absolute)

Atlas must never push to remote, open PRs, merge PRs, or touch origin. Atlas works
locally only; Cedris handles all remote actions and PRs.

All file edits, builds, tests, and verification happen on local branches. Atlas never
runs `git push`, `gh pr create`, `gh pr merge`, or any remote-mutating command.

## Remote branch policy

The only allowed remote branches are:

- `origin/main` - the only production/live branch
- `origin/staging` - the only remote integration branch

No other remote branches are permitted. Feature branches never exist on the remote.

## Push rules

- never push feature branches to remote
- never push directly to `main` unless Cedris explicitly approves
- only verified local `staging` gets pushed to remote, by Cedris
- promotion to `main` happens by PR from `staging` to `main`, opened by Cedris

## Branch model

- `main` is the only production/live branch
- `staging` is the only remote integration branch
- local feature branches must branch from `staging`
- work must be committed and tested locally before merge
- approved local feature work merges into local `staging`
- local feature branches are deleted after merge/promotion

## Local workflow

1. branch a feature from `staging`
2. commit and test locally (typecheck + build)
3. wait for Cedris approval
4. merge the approved feature into local `staging`
5. Cedris pushes verified `staging` to `origin/staging`
6. Cedris opens a PR from `staging` to `main`
7. after merge, delete the local feature branch
8. keep local `main` and `staging`

## Verification before merge

Before any feature branch merges into `staging`, run:

```sh
npm run typecheck  # tsc -b --noEmit, must report no errors
npm run build      # tsc -b && vite build, must emit dist/
```

A banned-copy scan guards public wording:

```sh
grep -RniE "cognitive training|brain training|wellness|exercise|improve your|mental fitness|devilish|N-back|nintendo|brain age|localStorage|sessionStorage" README.md index.html src || true
```

Expected: no matches in README, index.html, or src (the scan command line itself in README is the only acceptable match).

## Local feature branch cleanup

Local feature branches are deleted after their work is merged or promoted:

```sh
git branch -d feat/<name>
```

Keep local `main` and `staging`. Do not delete `staging`.

## Source of truth

This file and [docs/BRANCHING.md](docs/BRANCHING.md) are the canonical branch discipline
rules. Any local instruction file that disagrees with these is stale; these files win.