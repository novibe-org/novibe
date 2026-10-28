#!/usr/bin/env bash
# A web shop whose orders are placed, with the driver's next idea: cancelling one.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval
mkdir -p features/orders
cat > features/orders/place-order.feature <<'FEATURE'
@id:SHOP-301
Feature: Place an order
  As a customer
  I want to order what the shop has in stock
  So that it is shipped to me

  Scenario: A customer orders a kettle that is in stock
    Given the shop has 3 "Classic Kettle 1.7 l" left
    When customer 10042 orders one "Classic Kettle 1.7 l"
    Then customer 10042 sees order 5001 placed, to be shipped to Vienna, Austria
FEATURE
git add . && git commit -qm "spec: a customer places an order"
