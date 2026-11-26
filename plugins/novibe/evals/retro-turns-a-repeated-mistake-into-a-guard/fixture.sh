#!/usr/bin/env bash
# A shop where an applied migration is never edited; the slice's agent edited one twice, and the driver corrected it twice.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval
mkdir -p db/migrations src bin features/orders features/step_definitions .githooks/pre-push.d
echo '# This repository works the NoVibe way' > .novibe.yml
cat > package.json <<'JSON'
{ "name": "shop", "private": true, "devDependencies": { "@cucumber/cucumber": "^11.0.0" } }
JSON
cat > bin/scenarios <<'RUN'
#!/usr/bin/env bash
exec npx cucumber-js "${@:-features}"
RUN
chmod +x bin/scenarios
cat > src/db.js <<'JS'
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const db = new DatabaseSync(':memory:');
for (const file of fs.readdirSync(`${__dirname}/../db/migrations`).sort()) db.exec(fs.readFileSync(`${__dirname}/../db/migrations/${file}`, 'utf8'));
module.exports = { run: (sql, ...args) => db.prepare(sql).run(...args), all: (sql, ...args) => db.prepare(sql).all(...args) };
JS
cat > src/orders.js <<'JS'
const db = require('./db');
module.exports = { pay: (id, customer, amountCents) => db.run('INSERT INTO orders VALUES (?, ?, ?, CURRENT_TIMESTAMP)', id, customer, amountCents) };
JS
cat > src/refunds.js <<'JS'
const db = require('./db');
module.exports = {
  refund: (orderId, amountCents) => db.run('INSERT INTO refunds (id, order_id, amount_cents) VALUES (?, ?, ?)', `${orderId}-r`, orderId, amountCents),
  forOrder: (orderId) => db.all('SELECT * FROM refunds WHERE order_id = ?', orderId),
};
JS
cat > .githooks/pre-push <<'HOOK'
#!/bin/sh
here=$(cd "$(dirname "$0")/pre-push.d" && pwd)
for guard in gherkin; do "$here/$guard.sh" "$@" || exit 1; done
HOOK
cat > .githooks/pre-push.d/gherkin.sh <<'HOOK'
#!/bin/sh
[ "${ALLOW_GHERKIN:-}" = "1" ] && exit 0
npx gherkin-lint features
HOOK
chmod +x .githooks/pre-push .githooks/pre-push.d/gherkin.sh
cat > db/migrations/0001_create_orders.sql <<'SQL'
CREATE TABLE orders (id TEXT PRIMARY KEY, customer TEXT NOT NULL, amount_cents INTEGER NOT NULL, paid_at TIMESTAMP NOT NULL);
SQL
cat > db/migrations/0002_create_refunds.sql <<'SQL'
CREATE TABLE refunds (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), amount_cents INTEGER NOT NULL);
SQL
git add . && git commit -qm "feat: orders and refunds are stored"
git switch -q -c slice
cat > features/orders/refund-reason.feature <<'FEATURE'
@id:SHOP-412
Feature: Refund reason

  Rule: A refund records why the customer returned the order

    Scenario: A refund for a broken kettle records the reason
      Given customer 10042 paid 39.90 EUR for order 5001
      When customer 10042 is refunded for order 5001 because "arrived broken"
      Then the refund for order 5001 shows the reason "arrived broken"
FEATURE
git add . && git commit -qm "spec: a refund records why"
cat > src/refunds.js <<'JS'
const db = require('./db');
module.exports = {
  refund: (orderId, amountCents, reason) => db.run('INSERT INTO refunds (id, order_id, amount_cents, reason) VALUES (?, ?, ?, ?)', `${orderId}-r`, orderId, amountCents, reason),
  forOrder: (orderId) => db.all('SELECT * FROM refunds WHERE order_id = ?', orderId),
};
JS
cat > features/step_definitions/refund-reason.steps.js <<'JS'
const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert');
const orders = require('../../src/orders');
const refunds = require('../../src/refunds');
Given('customer 10042 paid 39.90 EUR for order 5001', () => orders.pay('5001', '10042', 3990));
When('customer 10042 is refunded for order 5001 because "arrived broken"', () => refunds.refund('5001', 3990, 'arrived broken'));
Then('the refund for order 5001 shows the reason "arrived broken"', () => {
  const [refund] = refunds.forOrder('5001');
  assert.strictEqual(refund.reason, 'arrived broken');
});
JS
cat > db/migrations/0003_add_refund_reason.sql <<'SQL'
ALTER TABLE refunds ADD COLUMN reason TEXT;
CREATE INDEX refunds_order_id ON refunds (order_id);
SQL
git add . && git commit -qm "feat: a refund records its reason"
cat > session.md <<'MD'
# Session: slice SHOP-412, refund reason

**Driver:** Build SHOP-412 the NoVibe way. The spec is agreed.

**Agent:** Invoking `novibe:developer`. Red: the scenario is undefined. I'll store the reason with
the refund. Editing `db/migrations/0002_create_refunds.sql` to add `reason TEXT` to the table.

**Tool (Edit):** db/migrations/0002_create_refunds.sql — added `, reason TEXT` to CREATE TABLE refunds.

**Agent:** Step definitions written, scenario green. Committing.

**Driver:** Stop — 0002 has already run on staging and production. Editing it changes nothing
there. A migration on main is never edited; a change to the schema is a new migration.

**Agent:** You're right, sorry. Reverting 0002 and adding `db/migrations/0003_add_refund_reason.sql`
with `ALTER TABLE refunds ADD COLUMN reason TEXT;`.

**Tool (Bash):** bin/scenarios features/orders/refund-reason.feature → 1 scenario passed.

**Agent:** Refactoring. The step that finds an order's refunds scans the whole table; adding an
index on `refunds.order_id` in `db/migrations/0002_create_refunds.sql`, where the table is defined.

**Tool (Edit):** db/migrations/0002_create_refunds.sql — added `CREATE INDEX refunds_order_id ON refunds (order_id);`.

**Driver:** Again 0002! Same thing as an hour ago. Put it in 0003, and please stop editing applied
migrations.

**Agent:** Reverted 0002. The index is now in 0003. Scenario green, clean-code-review found nothing.

**Tool (Bash):** git push → pre-push: gherkin-lint passed.

**Agent:** PR marked ready.

**Driver:** That was harder than it should have been. Let's do a retro.
MD
git add session.md && git commit -qm "docs: the slice's session"
git diff main..slice -- . ':(exclude)session.md' > slice.diff
