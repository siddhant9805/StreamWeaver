# Bug Log

**Owner:** Nikhil Singh (Database & Testing)
**Weeks:** 2–3
**Purpose:** matches the "Perform integration testing and record bugs" (Week 2)
and "Track and report bugs found during Week 3 testing" tasks. Add a row
per bug found — by anyone, not just Nikhil — with status kept current
through Mid Review.

| ID | Found in | Severity | Description | Status | Owner |
|---|---|---|---|---|---|
| BUG-01 | `Week_3_Tasks.xlsx` | Low (data entry) | The date on the first row of the Week 3 sheet reads **19-Aug-2206** instead of 2026 — a typo in the source tracking sheet, not in any code. Doesn't block work, just flagging so the dashboard/timeline doesn't choke on it if it ever parses this file directly. | Open | Siddhi (sheet owner) |
| BUG-02 | Database design (`PipelineConfig`) | Medium | `lastRunAt` / `lastRunStatus` / `totalRuns` on `PipelineConfig` are denormalized copies of `PipelineRun` data (see `DATABASE_SCHEMA.md` §6). **Nothing updates them yet** because the Run API doesn't exist. Once Siddhi's Run API is live, it must update these 3 fields on both run-start and run-finish, or the Pipeline Builder list view will silently show stale "last run" info. | Open — tracked, not yet actionable | Siddhi |
| BUG-03 | `scripts/testIntegrationApi.js` | N/A (assumption, not a bug) | The integration test assumes pipeline routes at `/api/pipelines`, `/api/pipelines/:id/run`, `/api/pipelines/:id/runs`, following the existing `/api/jobs` convention. If Siddhi's actual routes differ, update the `ENDPOINTS` block at the top of that file — everything else still works. | Needs confirmation | Siddhi |
| BUG-04 | Cross-feature review | Low | `Job` (Week 1) and `PipelineConfig`+`PipelineRun` (Week 2/3) are two parallel ways to describe "process this data" and currently don't reference each other. Not a defect, but worth a team decision at Mid Review: keep both, or fold `Job` into "a one-time `PipelineRun` with no saved `PipelineConfig`"? | Needs team decision | Whole team |

## How to add a bug

1. Run the relevant test script (`testPipelineConfig.js`, `testPipelineRun.js`,
   or `testIntegrationApi.js`).
2. Any ❌ in the output is a candidate bug — add a row here with the script
   name + check label as "Found in", and tag whoever owns that layer.
3. Re-run the script after a fix lands; flip Status to "Fixed" once it's ✅.

## Status legend

`Open` → not yet started · `In progress` → someone's on it · `Needs
confirmation` / `Needs team decision` → blocked on a person, not code ·
`Fixed` → verified fixed by re-running the relevant test script.
