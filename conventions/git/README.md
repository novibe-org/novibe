# Git

**A branch per slice, and a draft pull request from the first step.** The draft is where the
driver reads the spec and the model as they land; marking it ready is the claim it was
reviewed. Never commit to `main`, however small the change — that is where the habit goes.

**Never force-push a branch under review.** Follow-ups are fresh commits, or the driver loses
the diff of what changed since they last looked. Squashing is their call at merge.

## What `pre-push` refuses

- **A push to a branch whose pull request is already merged or closed.** Drivers merge fast and
  those commits are orphaned. Start again from the updated default branch.
- **A branch that contains every commit of another whose pull request is open.** Its pull
  request would review that work as well as its own, and landing it lands the other first.
  Override with `ALLOW_STACKED=1`.

Squash merges are handled. Asking whether a branch's commits are ancestors of `main` calls
every squash-merged branch unmerged for ever, because squashing puts the content in `main`
without the commits — so the guard asks which pull requests are open instead.

Both need `gh`, and both pass when it is absent: a guard that blocks an offline push is a guard
people disable.
