# Architecture decisions

One decision per file.

| ID | Decision | Status |
| -- | -------- | ------ |
| [01](01-language-typescript.md) | TypeScript + Node 20 + Zod + Playwright | Accepted |
| [02](02-target-local-mock.md) | Local CoreLink mock, not a public bank/cart | Accepted |
| [03](03-locators-accessibility.md) | A11y role+name / table cells; screenshots are evidence | Accepted |
| [04](04-no-vendor-cua-sdk.md) | Own `act` tool + artifact; no vendor CUA SDK as the contract | Accepted |
| [05](05-architecture-single-process.md) | One CLI process; no queues | Accepted |
| [06](06-hitl-same-session.md) | Pause/resume the live session; mock the console | Accepted |
| [07](07-safety-allowlist.md) | Origin/action allowlist; irreversible needs confirm or HITL | Accepted |
| [08](08-cuts-and-stretch.md) | What we will not build; overlay is the stretch | Accepted |
| [09](09-surface-independent-core.md) | Core is WHAT (`SurfaceDriver`); Playwright is HOW | Accepted |
| [10](10-capability-vendor-tenant-surface.md) | Four layers; overlay for label/emoji; CoreLink is a vendor product | Accepted |
| [11](11-llm-provider-port.md) | `LlmProvider` port; OpenAI SDK is one adapter | Accepted |

Summary: [DECISIONS.md](../DECISIONS.md).
