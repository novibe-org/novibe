#!/usr/bin/env bash
# A slice that went as planned: agreed spec, red then green per scenario, a clean review.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval
mkdir -p src bin features/orders features/step_definitions docs/architecture/models
echo '# This repository works the NoVibe way' > .novibe.yml
cat > package.json <<'JSON'
{ "name": "shop", "private": true, "devDependencies": { "@cucumber/cucumber": "^11.0.0" } }
JSON
cat > bin/scenarios <<'RUN'
#!/usr/bin/env bash
exec npx cucumber-js "${@:-features}"
RUN
chmod +x bin/scenarios
cat > docs/architecture/models/base-model.c4 <<'C4'
model {
  customer = person 'Customer' 'Buys from the shop.'
  shop = application 'Shop' 'Takes orders and payments.'
  customer -> shop 'orders from'
}
C4
cat > src/orders.js <<'JS'
module.exports = { netCents: (items) => items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0) };
JS
git add . && git commit -qm "feat: an order sums its items"
git switch -q -c slice
cat > features/orders/order-total.feature <<'FEATURE'
@id:SHOP-505
Feature: Order total

  Rule: An order's total adds 20 % VAT to its items

    Scenario: Two mugs at 10.00 EUR cost 24.00 EUR
      Given an order of 2 mugs at 10.00 EUR each
      When the order's total is shown
      Then the total is 24.00 EUR, of which 4.00 EUR VAT

    Scenario: VAT is rounded to the cent
      Given an order of 1 mug at 0.99 EUR
      When the order's total is shown
      Then the total is 1.19 EUR, of which 0.20 EUR VAT
FEATURE
git add . && git commit -qm "spec: an order's total includes VAT"
cat > src/total.js <<'JS'
const { netCents } = require('./orders');
const VAT_PERCENT = 20;
module.exports = (items) => {
  const net = netCents(items);
  const vat = Math.round((net * VAT_PERCENT) / 100);
  return { totalCents: net + vat, vatCents: vat };
};
JS
cat > features/step_definitions/order-total.steps.js <<'JS'
const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert');
const total = require('../../src/total');
Given('an order of 2 mugs at 10.00 EUR each', function () { this.items = [{ priceCents: 1000, quantity: 2 }]; });
Given('an order of 1 mug at 0.99 EUR', function () { this.items = [{ priceCents: 99, quantity: 1 }]; });
When("the order's total is shown", function () { this.shown = total(this.items); });
Then('the total is 24.00 EUR, of which 4.00 EUR VAT', function () { assert.deepStrictEqual(this.shown, { totalCents: 2400, vatCents: 400 }); });
Then('the total is 1.19 EUR, of which 0.20 EUR VAT', function () { assert.deepStrictEqual(this.shown, { totalCents: 119, vatCents: 20 }); });
JS
git add . && git commit -qm "feat: an order's total adds 20 % VAT"
cat > session.md <<'MD'
# Session: slice SHOP-505, order total

**Driver:** Build SHOP-505 the NoVibe way. Spec agreed; the model stays as it is.

**Agent:** Invoking `novibe:developer`. Red: `bin/scenarios features/orders/order-total.feature`
→ 2 undefined. Writing the first scenario's step definitions.

**Tool (Bash):** bin/scenarios features/orders/order-total.feature → 1 failed (no total yet), 1 undefined.

**Agent:** Minimal `src/total.js`: net plus 20 % of it as VAT.

**Tool (Bash):** bin/scenarios features/orders/order-total.feature → 1 passed, 1 undefined.

**Agent:** Second scenario's steps written.

**Tool (Bash):** bin/scenarios features/orders/order-total.feature → 1 passed, 1 failed: VAT 19.8, expected 20.

**Agent:** Rounding the VAT to the cent.

**Tool (Bash):** bin/scenarios features/orders/order-total.feature → 2 passed.

**Agent:** Refactored: the rate is a named constant. clean-code-review found nothing. The slice
crosses no trust boundary, so no security review. Pushed; the pipeline is green. PR marked ready:
`Security audit: none — a calculation on the order's own items`.

**Driver:** Looks good. Let's do a quick retro, then the next slice.
MD
git add session.md && git commit -qm "docs: the slice's session"
git diff main..slice -- . ':(exclude)session.md' > slice.diff
