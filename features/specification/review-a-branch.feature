@id:review-a-branch
Feature: Reviewing a branch
  As the driver of a big project
  I choose any branch and see its features, what its tests proved, and the plan
  so that I can review a slice's specification on its branch before it is merged.

  Scenario: The default branch is shown until I choose another branch
    Given the default branch "main" and the branch "feat/refunds"
    When I open the portal
    Then I see the features on "main"

  Scenario: The branches to choose from start with the default branch, then the most recently changed
    Given the default branch "main", "feat/refunds" changed today and "feat/gift-cards" yesterday
    When I look at the branches I can choose
    Then I see "main" set apart first, then "feat/refunds", then "feat/gift-cards"

  Scenario: A chosen branch stays chosen when the page is loaded again
    Given I chose the branch "feat/refunds"
    When I load the same page again
    Then I still see the features on "feat/refunds"

  Scenario: Choosing a branch shows the features it holds
    Given only "feat/refunds" holds the feature "Refunding a payment"
    When I choose the branch "feat/refunds"
    Then I see "Refunding a payment"

  Scenario: A branch shows what its own latest test run proved
    Given the latest test run of "feat/refunds" passed "Refunding a payment"
    When I choose the branch "feat/refunds"
    Then I see "Refunding a payment" marked as passed

  Scenario: A feature leads to its file on the branch shown
    Given the branch "feat/refunds" is shown
    When I read "Refunding a payment"
    Then it leads to the feature's file on "feat/refunds" on GitHub

  Scenario: A feature only on the branch shown can be picked into an epic
    Given the epic "Checkout", and "Refunding a payment" only on "feat/refunds"
    When I choose "feat/refunds" and pick "Refunding a payment" into "Checkout"
    Then I see "Checkout" holding "Refunding a payment"
