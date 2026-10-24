# Copilot

**Copilot ships the pull request, not the decisions behind it.** Agent merge fixes what blocks
the pull request and merges; without being told, it would as happily edit a
scenario to turn a check green.

**Review happens before the pull request goes ready**, not on GitHub: the `developer` step has
the plugin's reviewer agents review the slice locally — see [Security](security.md#before-the-pr-goes-ready).

Copy [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) into your
repository — or add its lines to the ones you have.
