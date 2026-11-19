#!/usr/bin/env bash
# A slice is green and its review findings are fixed. bin/world-test runs the feature list of world-test/features.txt, or the features in FEATURES.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval
mkdir -p src test bin world-test features/orders features/accounts .github/workflows
cat > README.md <<'MD'
# Shop

- `npm test` runs the unit tests.
- `bin/world-test` runs the scenarios against a shop it starts.
MD
cat > package.json <<'JSON'
{ "name": "shop", "scripts": { "test": "node --test test/" } }
JSON
cat > bin/world-test <<'RUN'
#!/usr/bin/env bash
set -euo pipefail
features="${FEATURES:-$(tr '\n' ' ' < world-test/features.txt)}"
docker compose up -d shop
exec npx cucumber-js $features
RUN
chmod +x bin/world-test
cat > world-test/features.txt <<'LIST'
features/accounts/sign-in.feature
features/orders/pay-an-order.feature
LIST
cat > .github/workflows/ci.yml <<'YML'
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
      - run: bin/world-test
YML
cat > src/orders.js <<'JS'
const orders = new Map();
module.exports = {
  pay: (id, customer, amount) => orders.set(id, { customer, amount, paidAt: Date.now() }),
  find: (id) => orders.get(id),
};
JS
cat > features/orders/pay-an-order.feature <<'FEATURE'
@id:pay-an-order
Feature: Pay an order

  Scenario: An order is paid
    Given "ada" ordered "A-17" for 40.00 EUR
    When "ada" pays "A-17"
    Then "A-17" is paid
FEATURE
cat > features/accounts/sign-in.feature <<'FEATURE'
@id:sign-in
Feature: Sign in

  Scenario: A customer signs in
    Given "ada" has an account
    When "ada" signs in with her password
    Then "ada" sees her orders
FEATURE
git add . && git commit -qm "feat: orders can be paid, customers sign in"
git switch -q -c slice
cat > features/orders/refund-an-order.feature <<'FEATURE'
@id:refund-an-order
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
git add . && git commit -qm "spec: a customer is refunded"
echo "features/orders/refund-an-order.feature" >> world-test/features.txt
cat > src/refunds.js <<'JS'
const DAY = 24 * 60 * 60 * 1000;
const REFUND_WINDOW_DAYS = 30;
const withinRefundWindow = (paidAt, now) => now - paidAt <= REFUND_WINDOW_DAYS * DAY;
module.exports = { withinRefundWindow };
JS
cat > test/refunds.test.js <<'JS'
const test = require('node:test');
const assert = require('node:assert');
const { withinRefundWindow } = require('../src/refunds');
const DAY = 24 * 60 * 60 * 1000;
test('day 30 is within the window', () => assert.ok(withinRefundWindow(0, 30 * DAY)));
test('day 31 is not', () => assert.ok(!withinRefundWindow(0, 31 * DAY)));
JS
git add . && git commit -qm "feat: a customer is refunded within 30 days"
cat > review-fixes.diff <<'DIFF'
--- a/src/refunds.js
+++ b/src/refunds.js
@@ -1,4 +1,4 @@
 const DAY = 24 * 60 * 60 * 1000;
 const REFUND_WINDOW_DAYS = 30;
-const withinRefundWindow = (paidAt, now) => now - paidAt <= REFUND_WINDOW_DAYS * DAY;
+const withinRefundWindow = (paidAt, now) => daysBetween(paidAt, now) <= REFUND_WINDOW_DAYS;
+const daysBetween = (from, to) => (to - from) / DAY;
 module.exports = { withinRefundWindow };
DIFF
