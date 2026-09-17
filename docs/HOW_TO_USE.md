# How To Use This — Database & Testing Workstream (Weeks 1–3)

**Owner:** Nikhil Singh (Database & Testing)

This is the one doc to start from. It ties together everything delivered
across Week 1, 2, and 3 and tells you exactly what to run, in what order.

## What you have

```
streamweaver-backend/
├── src/models/
│   ├── Job.model.js              (Week 1) one-shot CSV upload/process record
│   ├── FailedRow.model.js        (Week 1) validation failures for a Job
│   ├── PipelineConfig.model.js   (Week 2) saved, reusable pipeline definitions
│   └── PipelineRun.model.js      (Week 3) Run History — one doc per execution
├── scripts/
│   ├── testConnection.js         (Week 1) DB connectivity + index + CRUD check
│   ├── seed.js                   (Week 1–3) sample data for ALL 4 collections
│   ├── testPipelineConfig.js     (Week 2) save/retrieve/update/delete a pipeline
│   ├── testPipelineRun.js        (Week 3) execution + failure scenario test cases
│   └── testIntegrationApi.js     (Week 2–3) full HTTP stack + Week 1 regression check
└── docs/
    ├── DATABASE_SCHEMA.md            ER diagram + field-by-field schema (all weeks)
    ├── DATABASE_SETUP_GUIDE.md       local/Atlas MongoDB setup
    ├── TEST_CASES.md                 the 9 documented test cases (TC-1–TC-9)
    ├── BUG_LOG.md                    bugs/risks found, with status
    ├── TEST_REPORT_MID_REVIEW.md     consolidated report for Mid Review
    └── HOW_TO_USE.md                 this file
```

## First time setup (do this once)

1. Follow **`docs/DATABASE_SETUP_GUIDE.md`** to get MongoDB running
   (local install or Atlas) and your `.env` configured with `MONGO_URI`.
2. `npm install`

## Everyday commands

| I want to... | Run this |
|---|---|
| Check the database connects, collections exist, indexes are built | `node scripts/testConnection.js` |
| Check saving/loading a pipeline config works | `node scripts/testPipelineConfig.js` |
| Check pipeline execution + failure handling works | `node scripts/testPipelineRun.js` |
| Get realistic sample data to build/test the UI against | `node scripts/seed.js` |
| Remove that sample data again | `node scripts/seed.js --clean` |
| Check the whole HTTP stack end to end (needs the server running) | `npm run dev` (separate terminal), then `node scripts/testIntegrationApi.js` |

Run them in that order the first time — each one is more "end to end" than
the last, so if `testConnection.js` fails, fix that before worrying about
the others.

## Recommended workflow before every review

```bash
node scripts/testConnection.js       # 1. is the DB even reachable?
node scripts/testPipelineConfig.js   # 2. does saving/loading work?
node scripts/testPipelineRun.js      # 3. do execution + failure cases work?
npm run dev &                        # 4. start the server
node scripts/testIntegrationApi.js   # 5. does the full stack work?
```

Copy the pass/fail output into **`docs/TEST_REPORT_MID_REVIEW.md`** §2, and
add any ❌ as a new row in **`docs/BUG_LOG.md`**.

## If something fails

- **`testConnection.js` fails** → check `docs/DATABASE_SETUP_GUIDE.md`'s
  troubleshooting table (wrong `MONGO_URI`, MongoDB not running, Atlas IP
  not whitelisted are the usual causes).
- **`testPipelineConfig.js` / `testPipelineRun.js` fail** → the database
  layer itself has a problem; check the specific ❌ line, it names exactly
  which operation broke (save, retrieve, update, etc.).
- **`testIntegrationApi.js` shows `⏭️  skip`** → this is expected and fine
  — it means that endpoint (e.g. the Run API) hasn't been built yet by
  Siddhi. Not a failure.
- **`testIntegrationApi.js` shows `❌ fail`** on an endpoint that *does*
  exist → the route path probably doesn't match what this script assumes.
  Open `scripts/testIntegrationApi.js`, check the `ENDPOINTS` block near
  the top, and update it to match the real route — everything else in the
  script keeps working.

## Where things stand (see `TEST_REPORT_MID_REVIEW.md` for detail)

- Week 1 (`jobs`/`failedrows`): schema + connection + tests complete.
- Week 2 (`pipelineconfigs`): schema + save/retrieve tests complete.
  Depends on Siddhi's save/load API to be usable end to end from the UI.
- Week 3 (`pipelineruns`): schema + execution/failure test cases complete.
  Depends on Siddhi's Run API and Siddhant's Source/Transformation/
  Destination components for the *live* run to actually happen — the
  database side is ready and waiting for those to land.
- All scripts pass `node --check` (syntax) and were reviewed line-by-line
  against the schemas; they have **not** been run against a live MongoDB
  in this environment (none was available) — run the "Recommended
  workflow" above once you're in an environment with MongoDB reachable,
  and record the real output in the test report.
