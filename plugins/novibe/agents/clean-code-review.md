---
name: clean-code-review
description: Review a slice's code by the Clean Code reference the developer step names, each finding cited by its ID, and report without changing anything. Use when a slice changed code, before its PR goes ready.
tools: Read, Glob, Grep, Bash
---

# Clean code review

**In:** the branch, its default branch, and the path of the Clean Code reference.
**Out:** the findings, for the developer step to fix. You change nothing: no file, no commit, no
comment.

1. **Read the Clean Code reference** at the path you were given — its heuristics, by ID, are
   what you review by. No path, or nothing there? Stop, and report only
   `NOT RUN: no Clean Code reference`.
2. **Read the slice** — `git diff <default branch>...HEAD`, and the spec and the model it
   names, for the words a name must take (N3).
3. **Report** the slice's own lines only, never what was already there:
   `<ID> · <file>:<line> · <what the code does> · <the fix>`. Names (N) and one thing at one
   level (G30, G34) first. Leave out what you cannot tie to an ID. Nothing found? Say so.
