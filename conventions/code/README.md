# Code

**A comment states a constraint the code cannot express.** Everything else is narration, and
narration is the drift — it describes what the code said a month ago. If a comment explains
what something does, the name or the structure is what needed the work.

Agents are much worse at this than people, and get worse the longer a session runs.

## What `pre-push` refuses

A diff whose added comment lines exceed **both** a count (`COMMENT_BUDGET`, 3) and a share of
the added lines (`COMMENT_SHARE`, 25%). A share as well as a count because a new file earns its
header, while a refactor that is a quarter comments is narrating.

`COMMENT_GLOBS` names the files it reads — `*.ts *.js *.mjs *.java *.py *.go *.rb *.rs` by
default. Set it if your language is missing, or to narrow it: a guard that matches nothing
passes quietly, and a guard you believe you have is worse than none.

Override with `ALLOW_COMMENTS=1`, deliberately.
