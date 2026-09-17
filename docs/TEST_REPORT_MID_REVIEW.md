# Test Report — Mid Review (Weeks 1–3)

**Owner:** Nikhil Singh (Database & Testing)
**Covers:** Week 1 task "Test database, update README and upload final code";
Week 2 tasks "Test saving and retrieving pipeline configuration", "Test
frontend → backend → database flow", "Complete test notes and update
project documentation"; Week 3 tasks "Execute test cases and log results",
"Verify Week 1–3 features work together without conflicts", "Complete
test report and documentation for Mid Review".

## 1. What was tested and how

| Layer | Script | Covers |
|---|---|---|
| Connection + indexes + basic CRUD | `scripts/testConnection.js` | Week 1 — `jobs`, `failedrows` |
| Pipeline config save/retrieve | `scripts/testPipelineConfig.js` | Week 2 — `pipelineconfigs` |
| Pipeline execution + failure scenarios | `scripts/testPipelineRun.js` | Week 3 — `pipelineruns`, TC-1 through TC-4 (see `TEST_CASES.md`) |
| Full HTTP stack (frontend → backend → database) + Week 1 regression | `scripts/testIntegrationApi.js` | TC-8, TC-9 |
| Sample data for manual/UI testing | `scripts/seed.js` | All four collections |

## 2. Results

**Static verification (done, this environment):**
- All 5 model/script files pass `node --check` (no syntax errors).
- Every script was read through line-by-line against the schema
  definitions to confirm field names, types, and ref paths match.
- `docs/DATABASE_SCHEMA.md` was cross-checked against the actual
  `.model.js` files so the documentation can't drift from the code.

**Live database run: not yet executed in this environment** — no MongoDB
server is reachable here. **Action needed from whoever picks this up:**
run the four commands below against a real database (local or the team's
Atlas cluster) and paste the ✅/❌ output into this section before Mid
Review.

```bash
node scripts/testConnection.js
node scripts/testPipelineConfig.js
node scripts/testPipelineRun.js
npm run dev &                      # start the server first
node scripts/testIntegrationApi.js
```

<!-- Paste real output below once run against a live database: -->
```
(pending — run the commands above and paste results here)
```

## 3. Week 1–3 conflict check

Reviewed for schema/index/route collisions between the two feature sets:

| Check | Result |
|---|---|
| Collection name collisions (`jobs`/`failedrows` vs `pipelineconfigs`/`pipelineruns`) | None — four distinct collection names |
| Duplicate/conflicting indexes | None — each collection's indexes are independent |
| Shared code paths (`connectDB`, `errorHandler`, `env.js`) still work for both features | Yes — Week 2/3 models import the same `connectDB()`, no changes made to shared config |
| `seed.js` — Week 1 and Week 2/3 sample data can coexist | Yes — separate `SEED_TAG`-based cleanup for each, verified by reading through `--clean` logic |
| Route namespace | Week 1 uses `/api/jobs`, `/api/upload`, `/api/mapping`; Week 2/3 pipeline routes are assumed under `/api/pipelines` (see `BUG-03` in `BUG_LOG.md`) — no overlap either way |

No conflicts found at the design/static-review level. `testIntegrationApi.js`
includes an explicit Week 1 regression check (`GET /api/jobs` still
responds) so this gets re-verified automatically once it's run live.

## 4. Open items going into Mid Review

See `docs/BUG_LOG.md` for the live-tracked list. Summary:
- **BUG-02** (Medium): Run API needs to update `PipelineConfig.lastRun*`
  fields — not yet built, so not yet testable.
- **BUG-03**: Pipeline route paths are an assumption pending Siddhi's
  confirmation.
- **BUG-04**: Team decision needed on whether `Job` and `PipelineConfig`
  stay as two parallel features or get unified later.
- Live database run (Section 2) still needs to happen in an environment
  with MongoDB reachable.

## 5. Documentation delivered alongside this report

- `docs/DATABASE_SCHEMA.md` — ER diagram + full schema, all 4 collections
- `docs/DATABASE_SETUP_GUIDE.md` — local/Atlas setup
- `docs/TEST_CASES.md` — the 9 test cases (TC-1–TC-9) this report executes against
- `docs/BUG_LOG.md` — bug/risk tracking
- `docs/HOW_TO_USE.md` — single how-to guide tying all of the above together
