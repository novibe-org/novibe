@id:guard-installation
Feature: Guard rail installation
  As a maintainer of a repository that follows NoVibe
  I want to install NoVibe's guard rails and CI checks in one step, and take up their new versions
  So that its quality and security rules hold without copying them by hand

  Scenario: The guard rails installed in a repository without hooks
    Given repository "acme/shop" has no git hooks and no CI checks
    When the maintainer installs NoVibe's guard rails 1.0.0 in "acme/shop"
    Then every guard rail and CI check of 1.0.0 holds in "acme/shop"

  Scenario: A new version of the guard rails taken up
    Given "acme/shop" has NoVibe's guard rails 1.0.0, and 1.1.0 is released
    When the maintainer updates the guard rails in "acme/shop"
    Then every guard rail and CI check of 1.1.0 holds in "acme/shop"

  @backlog
  Scenario: The maintainer is told of a new version
    Given "acme/shop" has NoVibe's guard rails 1.0.0
    When NoVibe releases guard rails 1.1.0
    Then a pull request to "acme/shop" proposes updating them to 1.1.0
