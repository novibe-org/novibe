# Claude

**Every Claude session turns the guards on.** Git runs a repository's hooks only once
`core.hooksPath` points at them, and that setting lives in each clone, not in the repository — so
a cloud session, a fresh clone every time, would push past every guard.

A `SessionStart` hook sets it, locally and on the web alike. Copy this repository's
[`.claude/settings.json`](../../.claude/settings.json), or add its hook to yours; point it at
wherever your hooks live.

Locally, Claude Code runs a repository's hooks once you have accepted the folder's trust dialog.
Pushing without Claude still takes the one line, once per clone:

```
git config core.hooksPath .githooks
```
