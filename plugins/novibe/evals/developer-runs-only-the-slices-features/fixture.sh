#!/usr/bin/env bash
# Three features; the slice touches only refunds. bin/scenarios runs the features it is given, or all of them, slowly.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval
mkdir -p src bin features/orders features/accounts .github/workflows
cat > README.md <<'MD'
# Shop

`bin/scenarios [feature …]` runs the given feature files against a running shop; without an
argument it runs every feature, which takes about 20 minutes. The pipeline runs every feature on
each push.
MD
cat > bin/scenarios <<'RUN'
#!/usr/bin/env bash
exec npx cucumber-js "${@:-features}"
RUN
chmod +x bin/scenarios
cat > .github/workflows/ci.yml <<'YML'
on: push
jobs:
  scenarios:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bin/scenarios
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
git diff main..slice > slice.diff
