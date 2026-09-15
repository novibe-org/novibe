@id:read-the-features-on-main
Feature: Reading the features on the default branch
  As the driver of a big project
  I see every feature on the default branch and read any one of them
  so that I can tell what is done and what is missing, and decide what gets built next and how to slice it.

  Scenario: The features on the default branch are listed with their title, id and domain
    Given the default branch holds the feature "Paying with a saved card" with the id "pay-with-a-saved-card" in the domain "payments"
    When I open the portal
    Then I see "Paying with a saved card" listed with "pay-with-a-saved-card" and "payments"

  Scenario: Features are listed by domain, then by title, both alphabetically
    Given the default branch holds "Refunding a payment" in "payments", "Earning points" in "rewards" and "Paying with a saved card" in "payments"
    When I open the portal
    Then I see one list: "Paying with a saved card" in "payments", "Refunding a payment" in "payments", then "Earning points" in "rewards"

  Scenario: Reading a feature shows it as written
    Given the default branch holds the feature "Paying with a saved card" with a narrative, a rule and two scenarios
    When I read "Paying with a saved card"
    Then I see its narrative, its rule and both scenarios with all their steps, in the order written

  Scenario Outline: Reading a feature shows each part of it as written
    Given the default branch holds the feature "Paying with a saved card" with a <part>
    When I read "Paying with a saved card"
    Then I see its <part> as written

    Examples:
      | part                 |
      | background           |
      | rule description     |
      | scenario description |
      | doc string           |
      | data table           |
      | Examples table       |

  Scenario: A feature without an id is listed, marked as having no id
    Given the default branch holds the feature "Refunding a payment" without an id
    When I open the portal
    Then I see "Refunding a payment" listed, marked as having no id

  Scenario: A file that is not a readable feature is listed as broken
    Given the default branch holds "payments/refunds.feature", which is not a readable feature
    When I open the portal
    Then I see "refunds.feature" listed as broken

  Scenario: The default branch holds no features
    Given the default branch holds no features
    When I open the portal
    Then I am told the default branch has no features yet

  Rule: What is declared for later shows as backlog

    Scenario: A feature tagged backlog is listed as backlog
      Given the default branch holds the feature "Earning points" tagged "@backlog"
      When I open the portal
      Then I see "Earning points" listed as backlog

    Scenario: A scenario tagged backlog reads as backlog
      Given the feature "Paying with a saved card" holds the scenario "Paying in two currencies" tagged "@backlog"
      When I read "Paying with a saved card"
      Then I see "Paying in two currencies" marked as backlog

    Scenario: A scenario in a feature tagged backlog reads as backlog
      Given the default branch holds the feature "Earning points" tagged "@backlog" with the scenario "Earning points on a purchase"
      When I read "Earning points"
      Then I see "Earning points on a purchase" marked as backlog
