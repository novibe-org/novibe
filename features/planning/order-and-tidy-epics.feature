@id:order-and-tidy-epics
Feature: Ordering and tidying epics
  As the driver of a big project
  I put the epics and the features inside each in order, and rename or remove an epic
  so that the plan says what gets built next and in which order, as I decide it.

  Scenario: An epic moved before another takes its place in the order
    Given the epics "Checkout", "Refunds" and "Gift cards", in that order
    When I move "Gift cards" before "Checkout"
    Then I see the epics "Gift cards", "Checkout" and "Refunds", in that order

  Scenario: An epic moved to the end comes last
    Given the epics "Checkout", "Refunds" and "Gift cards", in that order
    When I move "Checkout" to the end
    Then I see the epics "Refunds", "Gift cards" and "Checkout", in that order

  Scenario: A feature moved before another in its epic takes its place
    Given the epic "Checkout" holds "Paying with a saved card", "Paying by invoice" and "Refunding a payment", in that order
    When I move "Refunding a payment" before "Paying with a saved card"
    Then I see "Checkout" holding "Refunding a payment", "Paying with a saved card" and "Paying by invoice", in that order

  Scenario: A feature moved to the end of its epic comes last
    Given the epic "Checkout" holds "Paying with a saved card" and "Paying by invoice", in that order
    When I move "Paying with a saved card" to the end of "Checkout"
    Then I see "Checkout" holding "Paying by invoice", then "Paying with a saved card"

  Scenario: A renamed epic keeps its place and its features
    Given the epics "Checkout" and "Refunds", and "Checkout" holds "Paying with a saved card"
    When I rename "Checkout" to "Saved cards"
    Then I see "Saved cards", holding "Paying with a saved card", then "Refunds"

  Scenario Outline: An epic cannot be renamed to an empty or taken title
    Given the epics "Checkout" and "Refunds"
    When I rename "Refunds" to "<title>"
    Then I still see the epics "Checkout" and "Refunds"

    Examples:
      | title    |
      |          |
      | Checkout |
      | checkout |

  Scenario: A removed epic's features go back to no epic
    Given the epic "Checkout" holds "Paying with a saved card"
    When I remove "Checkout" and confirm
    Then I no longer see "Checkout", and "Paying with a saved card" is not in any epic

  Scenario: An epic is not removed until I confirm
    Given the epic "Checkout"
    When I remove "Checkout" but do not confirm
    Then I still see the epic "Checkout"
