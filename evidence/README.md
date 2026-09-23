# Evidence

Checked-in runs a reviewer can open without a model key (except discovery, which already happened).

| Folder | What it is |
| --- | --- |
| `discovery/` | Live LLM discover of lookup-savings. `discovery.jsonl` (same records as `turns.jsonl`), `step-01.png`–`step-05.png`, compiled `artifact.json`. Do not invent this JSONL. |
| `replay_success/` | LLM-free replay of `capabilities/lookup_savings.json` with `member_id=12345`. `result.json` status `success`, `outputs.savings_balance=4250.00`. |
| `replay_not_found/` | Same artifact, `member_id=99999`. `result.json` status `business_outcome`, `outcome_code=MEMBER_NOT_FOUND`. |
| `escalate/` | `open_subaccount` without `--confirm`. `result.json` status `needs_intervention`, `step_id=s04_open`, `control.owner=human`. `intervention.json` + `OPERATOR.txt` are the HITL payload. `s04_open_stuck.png` is the live frame; the run did not POST `/open`. |

Regenerate the three replay folders (no API key):

```text
npm run record-evidence
```

Discover again only with a key in local `.env` (never committed):

```text
npm run cua -- discover --goal "Look up savings balance" --input member_id=12345 --evidence evidence/discovery
```
