# LikeC4

**The architecture model validates before it is pushed.** A reference to an element that no
longer exists, or a view whose layout has drifted, is caught here rather than by the next person
to open the model.

`pre-push` runs `likec4 validate` from the [`likec4`](https://www.npmjs.com/package/likec4)
package when it is installed and there is a `docs/architecture/` directory — `ARCHITECTURE_DIR`
if yours is elsewhere, `ALLOW_MODEL=1` to override.

**A pull request shows the reviewer what it changed in the architecture.** The reviewer sees the
views that changed, not the LikeC4 source behind them.

The [LikeC4 architecture diff](https://github.com/novibe-org/likec4-architecture-diff-action)
action compares the model of the pull request with its base and comments with each view that
changed, as one Mermaid diagram that GitHub renders in place: added elements and relationships
in green, changed ones in amber, and removed ones in red, put back where they were. A change to a description, a technology or a
view's include rules counts; a renamed or moved element shows as removed and added. Add it with
this workflow — `path` if your model is not in `docs/architecture/`:

```yaml
name: architecture-diff

on:
  pull_request:
    paths: ['docs/architecture/**']

permissions:
  contents: read
  pull-requests: write

jobs:
  architecture-diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: novibe-org/likec4-architecture-diff-action@v1
```
