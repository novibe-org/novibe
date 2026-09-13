# LikeC4

**The architecture model validates before it is pushed.** A reference to an element that no
longer exists, or a view whose layout has drifted, is caught here rather than by the next person
to open the model.

`pre-push` runs `likec4 validate` from the [`likec4`](https://www.npmjs.com/package/likec4)
package when it is installed and there is a `docs/architecture/` directory — `ARCHITECTURE_DIR`
if yours is elsewhere, `ALLOW_MODEL=1` to override.
