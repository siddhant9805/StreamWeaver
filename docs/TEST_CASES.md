# Test Cases — Pipeline Execution & Failure Scenarios

**Owner:** Nikhil Singh (Database & Testing)
**Week:** 3
**Automated by:** `scripts/testPipelineRun.js` (DB layer) and
`scripts/testIntegrationApi.js` (HTTP layer, once Siddhi's Run API exists)

Each test case below has a short ID so bugs found while executing it can be
linked back from `BUG_LOG.md` (e.g. "found while running TC-2").

| ID | Scenario | Steps | Expected result | Automated in |
|---|---|---|---|---|
| TC-1 | Successful run, end to end | Create a pipeline, trigger a run, let source → transformation → destination all succeed | Run status becomes `success`; `rowsSucceeded` + `rowsFailed` = `rowsProcessed`; `completedAt` is set; 3 log entries (one per step) | `testPipelineRun.js` |
| TC-2 | Transformation step throws | Run a pipeline whose transformation step references a missing field | Run status becomes `failed`; `error.step === 'transformation'`; `error.message` describes the failure; an `error`-level log entry exists | `testPipelineRun.js` |
| TC-3 | Run History ordering | Create 2+ runs for the same pipeline | `GET` run history returns runs sorted newest-first (`startedAt` descending) | `testPipelineRun.js` |
| TC-4 | Never-run pipeline | Query run history for a pipeline with 0 runs | Returns an empty array, **not** a 404/error | `testPipelineRun.js` |
| TC-5 | Source step fails (empty/unreadable file) | Trigger a run where the source CSV is empty or missing | Run status becomes `failed`; `error.step === 'source'`; `rowsProcessed === 0` | Manual — needs Siddhant's Source component; see Bug Log if this doesn't match |
| TC-6 | Destination write fails (e.g. invalid collection name) | Trigger a run with an invalid destination config | Run status becomes `failed`; `error.step === 'destination'`; partial `rowsSucceeded` before the failure point are still recorded, not silently dropped | Manual — needs Siddhant's Destination component (Week 3) |
| TC-7 | Concurrent runs of the same pipeline | Trigger two runs of the same pipeline close together | Both runs get separate `PipelineRun` documents; neither overwrites the other's log/counters | Manual — recommend testing once Run API exists |
| TC-8 | Full-stack flow (frontend → backend → database) | Use the Pipeline Builder UI to save a config, click "Run Pipeline", watch the status indicator | UI shows Running → Success/Failed, matching what's in `pipelineruns`; Run History page lists the new run | `testIntegrationApi.js` (HTTP layer) + manual UI check with Akiti |
| TC-9 | Week 1 regression | After Week 2/3 changes, hit the original upload/job endpoints | `/api/jobs`, `/api/upload/*` etc. still behave exactly as in Week 1 — no shared code broke them | `testIntegrationApi.js` |

## How to execute this test suite

```bash
# DB-layer test cases (TC-1 through TC-4) — no server needed
node scripts/testPipelineRun.js

# HTTP-layer test cases (TC-8, TC-9) — start the backend first
npm run dev
# in a second terminal:
node scripts/testIntegrationApi.js
```

TC-5, TC-6, and TC-7 depend on the Source/Destination components and the
Run API that Siddhant and Siddhi are still building this week — they're
listed here so nothing gets forgotten, and should move to "automated" once
those pieces land. Log results (pass/fail/blocked) in `TEST_REPORT_MID_REVIEW.md`.
