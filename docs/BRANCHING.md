# Branching

This is the detailed, human-readable branch workflow for flashmind.
For the hard rules, see [AGENTS.md](../AGENTS.md). AGENTS.md and this file are the
source of truth for branch discipline, release flow, and remote push rules.

## 1. Branch model

flashmind uses a main/staging/feature model:

- `main` - the only production/live branch
- `staging` - the only remote integration branch
- feature branches - short-lived, local only, never pushed

```
origin/main  <- production (live at https://flashmind.cedris.io)
origin/staging <- integration (Cedris pushes verified work here)
local feature branches <- all day-to-day work, never on the remote
```

## 2. Allowed remote branches

The remote (`origin`) may contain exactly two branches:

- `origin/main`
- `origin/staging`

No other remote branches are allowed. Feature branches are local only.

## 3. Forbidden push patterns

- never push a feature branch to remote
- never push directly to `main` unless Cedris explicitly approves
- never push unverified `staging` (it must pass typecheck + build first)
- never force-push to `main` or `staging`
- Atlas never runs any push; all remote actions are Cedris's

## 4. Normal local feature workflow

Start every unit of work the same way:

```sh
git checkout staging
git pull origin staging          # Cedris syncs staging; Atlas skips this
git checkout -b feat/<short-name>
```

Do the work, commit in small focused commits, and test locally:

```sh
npm run typecheck
npm run build
grep -RniE "cognitive training|brain training|wellness|exercise|improve your|mental fitness|devilish|N-back|nintendo|brain age|localStorage|sessionStorage" README.md index.html src || true
```

## 5. Verification commands

Before a feature branch can merge into `staging`, all of these must pass:

```sh
npm run typecheck   # tsc -b --noEmit, must report no errors
npm run build       # tsc -b && vite build, must emit dist/
# banned-copy scan: only acceptable match is the scan command line in README
```

Typecheck is a separate gate from build. Both must pass. Report pass/fail counts
explicitly; do not fold one into the other.

## 6. Approval / disapproval gate

After local verification passes, stop. Summarise:

- what changed
- verification results (typecheck, build, banned-copy scan)
- how to test

Wait for Cedris to approve before merging into `staging`. If work is disapproved,
fix on the same feature branch and re-verify. Do not merge unapproved work.

## 7. Merge to local staging

After approval, merge the feature into local `staging`:

```sh
git checkout staging
git merge --no-ff feat/<short-name> -m "merge feat/<short-name>: <summary>"
```

Resolve conflicts carefully, preserving the newest intended implementation.
Run verification again on `staging` after the merge:

```sh
npm run typecheck
npm run build
```

## 8. Push staging

Only verified local `staging` gets pushed, and only by Cedris:

```sh
git push origin staging
```

If `origin/staging` does not yet exist:

```sh
git push -u origin staging
```

Atlas never runs this. It is surfaced here for Cedris.

## 9. PR from staging to main

Promotion to `main` happens by PR from `staging` to `main`, opened by Cedris:

```sh
gh pr create --base main --head staging \
  --title "<summary>" \
  --body "<description, verification results, notes>"
```

`main` is never pushed to directly except by explicit Cedris approval. The PR is
the normal promotion path.

## 10. Post-merge cleanup

After Cedris confirms the PR is merged into `main`:

```sh
git checkout main
git pull origin main
git checkout staging
git merge main                   # keep staging aligned with the new main
git branch -d feat/<short-name>  # delete the merged local feature branch
```

Optional, only if Cedris confirms a remote feature branch existed (it should not):

```sh
git push origin --delete feat/<short-name>
```

Do not delete `staging`.

## 11. Final expected branch state

Local:

- `main` - present, aligned with `origin/main`
- `staging` - present, aligned with or ahead of `origin/staging`
- feature branches - none; deleted after merge/promotion

Remote:

- `origin/main` - present
- `origin/staging` - present
- no other branches