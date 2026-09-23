# Architecture decisions

One decision per file. Do not dump new choices into a single “locked stack” note.

| ID | Decision | Status | Implements in |
| -- | -------- | ------ | ------------- |
| [01](01-language-typescript.md) | TypeScript + Node 20 + Zod + Playwright | Accepted | Task 01 |
| [02](02-target-local-mock.md) | Local CoreLink mock, not a public bank/cart | Accepted | Task 02 |
| [03](03-locators-accessibility.md) | A11y role+name / table cells; screenshots are evidence | Accepted | Task 05, 08 |
| [04](04-no-vendor-cua-sdk.md) | Own `act` tool + artifact; no Operator/CUA SDK as the contract | Accepted | Task 06–08 |
| [05](05-architecture-single-process.md) | One CLI process; no queues | Accepted | Task 10 |
| [06](06-hitl-same-session.md) | Pause/resume the live Playwright context; mock the console | Accepted | Task 09 |
| [07](07-safety-allowlist.md) | Origin/action allowlist; irreversible needs confirm or HITL | Accepted | Task 04, 08 |
| [08](08-cuts-and-stretch.md) | What we will not build; overlay is the only stretch | Accepted | Task 12–13 |
| [09](09-surface-independent-core.md) | Core is WHAT (`SurfaceDriver`); Playwright is HOW | Accepted | Task 05, 06, 08 |
| [10](10-capability-vendor-tenant-surface.md) | Four layers; overlay for label/emoji; CoreLink is a vendor product | Accepted | Task 03, 12, 13 |
| [11](11-llm-provider-port.md) | `LlmProvider` port; OpenAI SDK is one adapter | Accepted | Task 05a, 06 |

New choices: copy [architecture-decision.md](../../ai-harness/templates/architecture-decision.md) to `12-short-name.md` here, status Proposed, then Accepted after the user agrees.

Summary for humans: [DECISIONS.md](../../DECISIONS.md).
