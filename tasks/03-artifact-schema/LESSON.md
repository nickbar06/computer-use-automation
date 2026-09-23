# Lesson 03 — The contract, not the chat log

**Read:** LEARN item 11 (Zod). Skim the result contract in [ARCHITECTURE.md](../../docs/ARCHITECTURE.md).

**Do:** Hand-write `capabilities/lookup_savings.json` from the schema **before** you have a compiler.

**Check you understand:**

- Where `$inputs.member_id` lives vs a literal `12345`.
- Why locators are a named map with **ordered fallbacks**.
- Why `business_outcomes` are declared on the artifact, not invented at runtime.
- Why a locator is a named strategy, not a Playwright `Locator`.
- Why `🔍 Search` is an overlay on `find_member`, not a new capability or a new surface.

Next: [../04-safety/README.md](../04-safety/README.md)
