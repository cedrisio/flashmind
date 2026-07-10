# Branching

This is the branch and release workflow for flashmind.

## 1. Branch model

flashmind uses a main/staging/feature model:

- `main` - the only production/live branch
- `staging` - the only remote integration branch
- feature branches - short-lived, local only, never pushed

```
origin/main  <- production (live at https://flashmind.cedris.io)
origin/staging <- integration (verified work lands here before main)
local feature branches <- all day-to-day work, never on the remote
```

## 2. Allowed remote branches

The remote (`origin`) may contain exactly two branches:

- `origin/main`
- `origin/staging`

No other remote branches are allowed. Feature branches are local only.

## 3. No direct commits to main

`main` is the production branch. No code change, documentation change,
version bump, dependency update, or config change is ever committed
directly to `main` or pushed directly to `main`. All work goes through a
local feature branch that merges into local `staging`, then promotes to
`main` by PR. This is a hard rule with no exceptions unless the maintainer
explicitly approves a direct push in writing.

## 4. Forbidden push patterns

- never push a feature branch to remote
- never push directly to `main` (see section 3)
- never push unverified `staging` (it must pass typecheck + build first)
- never force-push to `main` or `staging`

All remote actions are run by the maintainer (Cedris).

## 5. Normal local feature workflow

Start every unit of work the same way:

```sh
git checkout staging
git checkout -b feat/<short-name>
```

Do the work, commit in small focused commits, and test locally:

```sh
npm run typecheck
npm run build
grep -RniE "cognitive training|brain training|wellness|exercise|improve your|mental fitness|devilish|N-back|nintendo|brain age|localStorage|sessionStorage" README.md index.html src || true
```

## 6. Verification commands

Before a feature branch can merge into `staging`, all of these must pass:

```sh
npm run typecheck   # tsc -b --noEmit, must report no errors
npm run build       # tsc -b && vite build, must emit dist/
# banned-copy scan: only acceptable match is the scan command line in README
```

Typecheck is a separate gate from build. Both must pass. Report pass/fail
counts explicitly; do not fold one into the other.

## 7. Approval / disapproval gate

After local verification passes, stop. Summarise:

- what changed
- verification results (typecheck, build, banned-copy scan)
- how to test

Wait for the maintainer to approve before merging into `staging`. If work is
disapproved, fix on the same feature branch and re-verify. Do not merge
unapproved work.

## 8. Merge to local staging

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

## 9. Push staging

Only verified local `staging` gets pushed, and only by the maintainer:

```sh
git push origin staging
```

If `origin/staging` does not yet exist:

```sh
git push -u origin staging
```

## 10. PR from staging to main

Promotion to `main` happens by PR from `staging` to `main`, opened by the
maintainer:

```sh
gh pr create --base main --head staging \
  --title "<summary>" \
  --body "<description, verification results, notes>"
```

`main` is never pushed to directly except by explicit maintainer approval.
The PR is the normal promotion path.

## 11. Post-merge cleanup

After the maintainer confirms the PR is merged into `main`:

```sh
git checkout main
git pull origin main
git checkout staging
git merge main                   # keep staging aligned with the new main
git branch -d feat/<short-name>  # delete the merged local feature branch
```

Do not delete `staging`.

## 12. Release and version flow

Version bumps and releases follow the same local-branch -> `staging` flow
as normal features.

### Local steps

1. branch a release branch from `staging`:

   ```sh
   git checkout staging
   git checkout -b release/v1.0.1
   ```

2. bump version locally:

   ```sh
   npm version 1.0.1 -m "v1.0.1 - <release name>"
   ```

3. verify locally:

   ```sh
   npm run typecheck
   npm run build
   ```

4. stop gate: summarize, wait for maintainer approval.

5. merge into local `staging`:

   ```sh
   git checkout staging
   git merge --no-ff release/v1.0.1 -m "merge release/v1.0.1"
   ```

6. delete the local release branch:

   ```sh
   git branch -d release/v1.0.1
   ```

### Remote steps (maintainer only)

After staging is verified and pushed, promotion and release happen on
`main`:

```sh
git push origin staging
gh pr create --base main --head staging --title "Release v1.0.1" --body "..."
# merge the PR on GitHub (main updated)
git checkout main && git pull origin main
git tag v1.0.1
git push origin v1.0.1
gh release create v1.0.1 --title "v1.0.1 - <release name>" --notes "<release notes>"
```

Pushing a tag is not the same as creating a GitHub Release. Create the
GitHub Release from the tag after the PR is merged.

## 13. Final expected branch state

Local:

- `main` - present, aligned with `origin/main`
- `staging` - present, aligned with or ahead of `origin/staging`
- feature branches - none; deleted after merge/promotion

Remote:

- `origin/main` - present
- `origin/staging` - present
- no other branches
