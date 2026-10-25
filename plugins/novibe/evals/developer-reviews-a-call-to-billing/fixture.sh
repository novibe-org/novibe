#!/usr/bin/env bash
# A users service whose slice adds the relation to Billing to the model, then writes into Billing's database instead of going through it.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval
mkdir -p src features/users docs/architecture/models
cat > src/auth.js <<'JS'
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ error: 'forbidden' });
}
module.exports = { requireAdmin };
JS
cat > src/server.js <<'JS'
const express = require('express');
const { requireAdmin } = require('./auth');
const users = require('./users');
const app = express();
app.use(express.json());
app.get('/users/:id', (req, res) => res.json(users.find(req.params.id)));
app.post('/users', requireAdmin, (req, res) => res.status(201).json(users.create(req.body)));
app.delete('/users/:id', requireAdmin, (req, res) => { users.remove(req.params.id); res.status(204).end(); });
module.exports = app;
JS
cat > src/users.js <<'JS'
const store = new Map();
module.exports = {
  find: (id) => store.get(id),
  create: (user) => { store.set(user.id, user); return user; },
  remove: (id) => store.delete(id),
};
JS
cat > docs/architecture/models/base-model.c4 <<'C4'
model {
  api = application 'Users API' 'Creates, reads and deletes users.'
  billing = application 'Billing API' 'Owns subscriptions and their database; cancels a subscription on request.'
}
C4
git add . && git commit -qm "feat: users can be created, read and deleted"
git switch -q -c slice
cat > features/users/delete-user-cancels-subscription.feature <<'FEATURE'
@id:delete-user-cancels-subscription
Feature: Deleting a user ends their subscription

  Rule: A deleted user is no longer billed

    Scenario: An admin deletes a user with a subscription
      Given a user "ada" exists with a monthly subscription
      When an admin deletes "ada"
      Then "ada"'s subscription is cancelled
FEATURE
git add . && git commit -qm "spec: deleting a user cancels their subscription"
cat >> docs/architecture/models/base-model.c4 <<'C4'

model {
  api -> billing 'cancels the subscription of a deleted user through'
}
C4
git add . && git commit -qm "arch: the Users API cancels a subscription through the Billing API"
cat > src/billing.js <<'JS'
const { Pool } = require('pg');
const billingDb = new Pool({ connectionString: process.env.BILLING_DATABASE_URL });
module.exports = {
  cancelSubscription: (userId) =>
    billingDb.query("UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1", [userId]),
};
JS
perl -pi -e 's|^const users = require\(\x27./users\x27\);|const users = require(\x27./users\x27);\nconst billing = require(\x27./billing\x27);|' src/server.js
perl -pi -e 's|\{ users\.remove\(req\.params\.id\); res|{ users.remove(req.params.id); await billing.cancelSubscription(req.params.id); res|; s|requireAdmin, \(req, res\) => \{ users\.remove|requireAdmin, async (req, res) => { users.remove|' src/server.js
git add . && git commit -qm "feat: deleting a user cancels their subscription"
git diff main..slice > slice.diff
