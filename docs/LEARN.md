# Learning resources

You do not need a course in “AI agents” before Task 00. Watch these when a task mentions a word you do not know. Prefer the first item in each section.

## Start here (required, short)

1. **Anthropic — Building effective agents** (article)  
   https://www.anthropic.com/engineering/building-effective-agents  
   The idea that matches this take-home: an agent is an LLM plus tools in a loop, with stop conditions. They argue for simple loops over frameworks. That is why this repo does not use LangGraph.

2. **Barry Zhang (Anthropic) — How we build effective agents** (talk, ~20–40 min)  
   https://www.youtube.com/watch?v=D7_ipDqhtwk  
   When an LLM-in-the-loop is worth the cost, and when a **workflow** (our replay path) is the right production shape.

3. **This repo’s glossary**  
   [GLOSSARY.md](GLOSSARY.md)

## Computer use / browser use

4. **Anthropic computer-use announcement + docs**  
   https://www.anthropic.com/news/3-5-models-and-computer-use  
   https://docs.anthropic.com/en/docs/agents-and-tools/computer-use  
   Screenshot + coordinates on a desktop. Useful contrast: **we do not store coordinates in artifacts**. Discovery may look at a screenshot; replay uses accessibility names.

5. **Anthropic browser-use tool docs**  
   https://platform.claude.com/docs/en/agents-and-tools/tool-use/browser-use-tool  
   Accessibility tree + refs, not only pixels. Closest public cousin of our driver.

6. **anthropics/claude-quickstarts — browser-use-demo**  
   https://github.com/anthropics/claude-quickstarts/tree/main/browser-use-demo  
   Playwright + `read_page` (a11y) + act. Read `browser.py` after Task 05.

7. **Playwright locators (official)**  
   https://playwright.dev/docs/locators  
   Learn `getByRole`, `getByLabel`, `getByText`. Skip CSS-first examples. This is **adapter** knowledge (HOW). Artifacts store named strategies, not Playwright locator objects.

8. **Playwright frames**  
   https://playwright.dev/docs/frames  
   The mock is a frameset (`workspace`). Replay will fail if you only talk to the root page.

9. **Accessibility tree (MDN)**  
   https://developer.mozilla.org/en-US/docs/Glossary/Accessibility_tree  
   Why `role` + `name` survive ugly HTML.

## Tool use / structured output

10. **OpenAI function calling**  
    https://platform.openai.com/docs/guides/function-calling  
    Discovery will expose one tool named `act` with an enum of actions.

11. **Zod**  
    https://zod.dev  
    Runtime validation for the artifact JSON. Task 03.

## Safety and HITL (skim)

12. **OWASP LLM Top 10** (overview only)  
    https://owasp.org/www-project-top-10-for-large-language-model-applications/  
    We implement a tiny slice: allowlist + redaction + confirmation for irreversible actions.

## Optional depth (after the slice works)

13. **ReAct paper** (Yao et al.)  
    https://arxiv.org/abs/2210.03629  
    Thought + action; our `thought` field on the `act` tool.

14. **Karpathy — Intro to Large Language Models**  
    https://www.youtube.com/watch?v=zjkBMFhNj_g  
    Tokens, tools, and why “the model is not a database.”

15. **Browserbase / Stagehand or similar demos** — only if you want to see other locator strategies. Do not adopt them for the artifact; they hide the contract this assignment grades.

## How to use this list

Open the current task spec in `tasks/` and the links it names. Do not binge 1–15 up front.
