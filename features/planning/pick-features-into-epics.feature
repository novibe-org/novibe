@id:pick-features-into-epics
Feature: Picking features into epics
  As the driver of a big project
  I start epics and pick the features on main into them
  so that I can decide what gets built next and in which order, without changing the specification.

  Scenario: A new epic comes after the epics already started
    Given the epic "Checkout"
    When I start the epic "Refunds"
    Then I see "Checkout", then "Refunds" holding no features yet

  Scenario: An epic needs a title
    Given the epic "Checkout"
    When I start an epic without a title
    Then I still see only the epic "Checkout"

  Scenario: A picked feature goes to the end of the epic
    Given the epic "Checkout" holds "Paying with a saved card"
    When I pick "Refunding a payment" into "Checkout"
    Then I see "Checkout" holding "Paying with a saved card", then "Refunding a payment"

  Scenario: A feature is in at most one epic
    Given the epic "Checkout" holds "Paying with a saved card", and there is the epic "Refunds"
    When I pick "Paying with a saved card" into "Refunds"
    Then I see "Paying with a saved card" in "Refunds" and no longer in "Checkout"

  Scenario: A feature taken out of its epic is in no epic again
    Given the epic "Checkout" holds "Paying with a saved card"
    When I take "Paying with a saved card" out of "Checkout"
    Then I see "Paying with a saved card" as not in any epic

  Scenario: Features in no epic show after the epics, as before
    Given the epic "Checkout" holds "Paying with a saved card"
    And main also holds "Refunding a payment" in "payments" and "Earning points" in "rewards"
    When I open the portal
    Then after "Checkout" I see "payments" with "Refunding a payment", then "rewards" with "Earning points", as not in any epic

  Scenario: Only a feature with an id can be picked into an epic
    Given the epic "Checkout" and the feature "Refunding a payment" without an id
    When I try to pick "Refunding a payment" into "Checkout"
    Then I see "Refunding a payment" still as not in any epic

  Scenario: A backlog feature can be picked, and stays marked as backlog
    Given the epic "Checkout" and the feature "Earning points" tagged "@backlog"
    When I pick "Earning points" into "Checkout"
    Then I see "Earning points" in "Checkout", marked as backlog

  Scenario: A feature no longer on main stays in its epic, marked as gone
    Given the epic "Checkout" holds the feature with the id "pay-by-cheque"
    And main no longer holds a feature with that id
    When I open the portal
    Then I see "pay-by-cheque" in "Checkout", marked as no longer on main

  Scenario: The epics are kept until I change them
    Given the epic "Checkout" holds "Paying with a saved card"
    When I open the portal again later
    Then I still see "Paying with a saved card" in "Checkout"
