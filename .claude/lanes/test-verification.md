---
eligible_agents: [test-writer]
default_agent: test-writer
---

## Owns

the verification lane (tests)

## Dependency hints

- `domain-backend` — the code under test must land before it can be verified
- `frontend-ui` — the client behaviour under test
- `data-migration` — the schema and data the assertions read
- `api-integration` — the surfaces the tests exercise
- `observability-release` — the workflows and gates the suite runs under
