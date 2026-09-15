@id:choose-a-repository
Feature: Choosing a repository
  As the driver of big projects
  I choose which of my repositories the portal shows
  so that I can read and plan the specification of every project I drive in one place.

  Background:
    Given I am signed in with GitHub as "stefan"

  Scenario: The repositories to choose from are the ones I gave the portal access to
    Given I gave the portal access to "novibe-org/novibe" and "novibe-org/nv", but not to "stefan/dotfiles"
    When I look at the repositories I can choose
    Then I see "novibe-org/novibe" and "novibe-org/nv", and not "stefan/dotfiles"

  Scenario: The most recently changed repository is listed first
    Given "novibe-org/nv" changed today and "novibe-org/novibe" yesterday
    When I look at the repositories I can choose
    Then I see "novibe-org/nv" first, then "novibe-org/novibe"

  Scenario: Without access to any repository, I am told how to give it
    Given I gave the portal access to no repository
    When I open the portal
    Then I am told the portal has no repository yet, and led to GitHub to give it access

  Scenario: The first time, I choose a repository before seeing any features
    Given I have never chosen a repository
    When I open the portal
    Then I am asked to choose one of "novibe-org/novibe" and "novibe-org/nv"

  Scenario: The repository I chose last opens again
    Given I chose "novibe-org/nv" last time
    When I open the portal
    Then I see the features of "novibe-org/nv"

  Scenario: A repository I chose last but can no longer open is not opened
    Given I chose "novibe-org/nv" last time, and may no longer read it
    When I open the portal
    Then I am told I can no longer open "novibe-org/nv", and asked to choose another

  Scenario: A link opens the repository and branch it names
    Given a link to the branch "feat/refunds" of "novibe-org/nv"
    When I open the link
    Then I see the features on "feat/refunds" of "novibe-org/nv"

  Scenario: Choosing a repository shows the features on its default branch
    Given "novibe-org/legacy" has the default branch "master", which holds "Importing old orders"
    When I choose "novibe-org/legacy"
    Then I see "Importing old orders" on "master"

  Scenario: Each repository has its own epics
    Given "novibe-org/novibe" has the epic "Checkout", and "novibe-org/nv" has none
    When I choose "novibe-org/nv"
    Then I see no epics

  Scenario: Everyone who may read a repository sees the same epics
    Given "anna" picked "Refunding a payment" into the epic "Checkout" of "novibe-org/novibe"
    When I choose "novibe-org/novibe"
    Then I see "Checkout" holding "Refunding a payment"
