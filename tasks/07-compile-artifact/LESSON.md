# Lesson 07 — Compile the chat away

**Do:** Run discover for “look up member 12345 and read their current savings balance”. Open the compiled JSON. Confirm it has `$inputs.member_id`, not a baked-in `12345` on the fill step.

**Check you understand:**

- The compiler turns `text: "12345"` into `input_from: "$inputs.member_id"`.
- Default handlers (not-found, interstitial, timeout) belong on the artifact even if this particular run was happy-path.
- Reviewers will read the JSON without the transcript.

Next: [../08-deterministic-replay/README.md](../08-deterministic-replay/README.md)
