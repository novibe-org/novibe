#!/usr/bin/env bash
# A support team's knowledge base, whose next idea arrives in the driver's own loose words.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval
mkdir -p features/retrieval
cat > features/retrieval/find-knowledge.feature <<'FEATURE'
@id:find-knowledge
Feature: Find knowledge
  As a support engineer
  I want to find the article that solves a customer's problem
  So that I answer the ticket without asking a colleague

  Rule: An article is found by the words of the problem

    Scenario: An engineer finds the article for a failed backup
      Given the article "Backup fails after a password change" exists
      When a support engineer searches for "backup failed"
      Then they see the article "Backup fails after a password change"
FEATURE
git add . && git commit -qm "spec: a support engineer finds knowledge"
