# Git

**A branch per slice, and a draft pull request from the first step.** The draft is where the
driver reads the spec and the model as they land; marking it ready is the claim it was
reviewed. Never commit to `main`, however small the change — that is where the habit goes.

**Never force-push a branch under review.** Follow-ups are fresh commits, or the driver loses
the diff of what changed since they last looked. Squashing is their call at merge.

## What `pre-push` refuses

- **A push to a branch whose pull request is already merged or closed.** Drivers merge fast and
  those commits are orphaned. Start again from the updated default branch.
- **A rewrite of a branch whose pull request is open** — a push that is not a fast-forward.
  Override with `ALLOW_FORCE=1`.
- **A push carrying another open pull request's commits.** Usually it means the branch was cut
  from that branch rather than from `main`. Its pull request then reviews work that is not its
  own, and merging it merges the other one too. Override with `ALLOW_STACKED=1`.

Squash merges are handled. Asking whether a branch's commits are ancestors of `main` calls
every squash-merged branch unmerged for ever, because squashing puts the content in `main`
without the commits — so the guard asks which pull requests are open instead, and compares
against each one's head commit as GitHub reports it, so a branch nobody fetched is still caught.

All three need `gh`, and all three pass when it is absent: a guard that blocks an offline push is
a guard people disable.

Every guard checks `HEAD`, so [`.githooks/pre-push`](../../.githooks/pre-push) first refuses a
push of a branch you have not checked out, a push of `HEAD` to a branch of another name or to a
tag, or a push of more than one ref that is not a delete — override with `ALLOW_OTHER_REFS=1`. A push that only
deletes runs no guard: there is nothing in it to check.
