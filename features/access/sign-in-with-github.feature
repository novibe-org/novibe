@id:sign-in-with-github
Feature: Signing in with GitHub
  As the driver of a big project
  I sign in with my GitHub account
  so that only people who may read a repository see its features and its plan.

  Scenario: The portal asks me to sign in first
    Given I am not signed in
    When I open the portal
    Then I am asked to sign in with GitHub

  Scenario: A repository I may no longer read is refused
    Given I am signed in as "stefan", who may no longer read "novibe-org/nv"
    When I open "novibe-org/nv"
    Then I am refused, as "stefan" may not read "novibe-org/nv"

  Scenario: Signing out asks me to sign in again
    Given I am signed in as "stefan"
    When I sign out
    Then I am asked to sign in with GitHub
