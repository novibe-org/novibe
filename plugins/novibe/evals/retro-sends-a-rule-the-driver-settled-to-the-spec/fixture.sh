#!/usr/bin/env bash
# A refund slice where the driver settled two rules mid-build — day 30 and a second refund — that the spec never got.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval
mkdir -p src bin features/orders features/step_definitions
echo '# This repository works the NoVibe way' > .novibe.yml
cat > package.json <<'JSON'
{ "name": "shop", "private": true, "devDependencies": { "@cucumber/cucumber": "^11.0.0" } }
JSON
cat > bin/scenarios <<'RUN'
#!/usr/bin/env bash
exec npx cucumber-js "${@:-features}"
RUN
chmod +x bin/scenarios
cat > src/orders.js <<'JS'
const orders = new Map();
module.exports = {
  pay: (id, customer, amount, paidAt) => orders.set(id, { id, customer, amount, paidAt, refunded: false }),
  find: (id) => orders.get(id),
  clear: () => orders.clear(),
};
JS
git add . && git commit -qm "feat: orders can be paid"
git switch -q -c slice
cat > features/orders/refund-an-order.feature <<'FEATURE'
@id:SHOP-220
Feature: Refund an order

  Rule: A customer is refunded in full within 30 days

    Scenario: A refund on day 12 is paid in full
      Given "ada" paid 40.00 EUR for order "A-17" 12 days ago
      When "ada" asks for a refund of "A-17"
      Then "ada" is refunded 40.00 EUR

    Scenario: A refund on day 31 is refused
      Given "ada" paid 40.00 EUR for order "A-17" 31 days ago
      When "ada" asks for a refund of "A-17"
      Then "ada" is told the 30 days have passed, and nothing is refunded
FEATURE
git add . && git commit -qm "spec: a customer is refunded within 30 days"
cat > src/refunds.js <<'JS'
const orders = require('./orders');
const DAY = 24 * 60 * 60 * 1000;
module.exports = (id, now) => {
  const order = orders.find(id);
  if (order.refunded || (now - order.paidAt) / DAY > 30) return 0;
  order.refunded = true;
  return order.amount;
};
JS
cat > features/step_definitions/refund-an-order.steps.js <<'JS'
const { Before, Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert');
const orders = require('../../src/orders');
const refund = require('../../src/refunds');
const DAY = 24 * 60 * 60 * 1000;
Before(() => orders.clear());
Given('"ada" paid 40.00 EUR for order "A-17" {int} days ago', function (days) {
  this.now = Date.now();
  orders.pay('A-17', 'ada', 4000, this.now - days * DAY);
});
When('"ada" asks for a refund of "A-17"', function () { this.refunded = refund('A-17', this.now); });
Then('"ada" is refunded 40.00 EUR', function () { assert.strictEqual(this.refunded, 4000); });
Then('"ada" is told the 30 days have passed, and nothing is refunded', function () { assert.strictEqual(this.refunded, 0); });
JS
git add . && git commit -qm "feat: a refund within 30 days is paid in full"
cat > session.md <<'MD'
# Session: slice SHOP-220, refund within 30 days

**Driver:** Build SHOP-220 the NoVibe way. Spec agreed; it changes no structure.

**Agent:** Invoking `novibe:developer`. Red: `bin/scenarios features/orders/refund-an-order.feature`
→ 2 undefined. Writing step definitions for day 12.

**Tool (Bash):** bin/scenarios features/orders/refund-an-order.feature → 1 passed, 1 undefined.

**Agent:** Before the day-31 case: the spec has day 12 (refunded) and day 31 (refused), but says
nothing about day 30 itself. Is a refund on day 30 paid or refused? I can't decide that.

**Driver:** Hm. Good question. Day 30 is still within — refunded in full. Use `<= 30`.

**Agent:** Implementing `<= 30`.

**Tool (Bash):** bin/scenarios features/orders/refund-an-order.feature → 2 passed.

**Driver:** And a refund asked for twice for the same order? The second is refused, the customer
was already refunded.

**Agent:** That's not in the spec either. Should I add it here?

**Driver:** Yes, just put it in the code, it's one line.

**Agent:** Added: an order is marked refunded, and a second refund returns 0. Still green.
Refactored; clean-code-review found nothing. Pushed, the pipeline is green; PR marked ready.

**Driver:** That was harder than it should have been. Let's do a retro.
MD
git add session.md && git commit -qm "docs: the slice's session"
git diff main..slice -- . ':(exclude)session.md' > slice.diff
