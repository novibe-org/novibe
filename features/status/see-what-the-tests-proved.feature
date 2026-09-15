@id:see-what-the-tests-proved
Feature: Seeing what the tests proved
  As the driver of a big project
  I see for each scenario on main whether the tests proved it
  so that I can tell what is done and what is still missing.

  Scenario Outline: A scenario shows what main's latest run made of it
    Given main's latest test run <result> the scenario "Paying with a saved card"
    When I read its feature
    Then I see "Paying with a saved card" marked as <result>

    Examples:
      | result |
      | passed |
      | failed |

  Scenario: A scenario the latest run left out shows as not run
    Given main's latest test run did not run the scenario "Refunding a payment"
    When I read its feature
    Then I see "Refunding a payment" marked as not run

  Scenario: A backlog scenario the latest run did run shows what the run made of it
    Given the scenario "Paying in two currencies" is tagged "@backlog"
    And main's latest test run passed it
    When I read its feature
    Then I see "Paying in two currencies" marked as passed

  Scenario: An outline counts once, and fails when one of its examples failed
    Given main's latest test run passed the outline "Paying in <currency>" for "EUR" and failed it for "USD"
    When I read its feature
    Then I see "Paying in <currency>" marked as failed, counted as one scenario

  Scenario: A feature shows how many of its scenarios passed
    Given main's latest test run passed 2 and failed 1 of the 3 scenarios of "Paying with a saved card"
    When I open the portal
    Then I see "Paying with a saved card" with 2 of 3 passed

  Scenario: A feature's backlog scenarios count among its scenarios
    Given "Earning points" has 2 scenarios the latest run passed and 1 tagged "@backlog" it did not run
    When I open the portal
    Then I see "Earning points" with 2 of 3 passed

  Scenario: An epic shows how many of its features' scenarios passed
    Given the epic "Checkout" holds "Paying with a saved card" with 2 of 3 passed and "Paying by invoice" with 1 of 2 passed
    When I open the portal
    Then I see "Checkout" with 3 of 5 passed

  Scenario: The portal says when main's latest test run happened
    Given main's latest test run finished 2 hours ago
    When I open the portal
    Then I see that the tests ran 2 hours ago

  Scenario: Results from an earlier main are shown and said to be earlier
    Given main's latest test run ran for an earlier commit than the main shown
    When I open the portal
    Then I see its results, said to be from an earlier main

  Scenario: Main without a test run says so
    Given main has never had a test run
    When I open the portal
    Then I am told main has no test run yet
