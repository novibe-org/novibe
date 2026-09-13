---
name: security-review
description: Review the code in a pull request for security problems it introduces — the highest-risk findings first.
---

# Security review

Read the changed code, and follow untrusted input from where it enters — a request, a file, a
message, an environment variable, another service's response — to everywhere it is used. Flag
what makes the system exploitable:

- **injection** — input reaching SQL, a shell, a template, a path, a URL fetched server-side, or a
  deserializer
- **access** — an entry point with no authentication or authorization check, or a check a caller
  can bypass
- **isolation** — one user's or tenant's data reachable by another
- **exposure** — secrets, tokens or personal data in logs, errors, responses or the client
- **unsafe defaults** — permissive CORS, cookies without `Secure`/`HttpOnly`, disabled TLS
  verification, weak or home-made cryptography

For each finding: the file and line, how an attacker would exploit it, and the fix. Highest risk
first; leave out what is not exploitable.
