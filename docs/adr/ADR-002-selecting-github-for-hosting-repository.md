# ADR-002: Selecting Github for hosting the source repository
## Status: Accepted (Date: 2026-9-9)
## Context
While the Astro blog could be stored on a local device, it limited the blogs ability to be edited across multiple devices or store its contents if a disaster happened to the local device. A platform to host the repository would solve this problem.
## Decision
We chose Github over alternatives such as Forgejo and Gitea due to it's reputation as the industry standard and access to tools such as Github Actions
## Consequences
- Positive: Access to a wide arrange of tools such as Github Actions and project management.
- Negative: Recent infastructure problems could halt production when Github is down.