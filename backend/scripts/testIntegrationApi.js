/**
 * scripts/testIntegrationApi.js
 *
 * Week 2 task: "Test frontend -> backend -> database flow" +
 *              "Perform integration testing and record bugs"
 * Week 3 task: "Verify Week 1-3 features work together without conflicts"
 *
 * This is deliberately an HTTP-level test (uses Node's built-in `fetch`,
 * no new dependency) rather than a direct model test: it proves the
 * whole chain — HTTP request -> Express route -> controller -> Mongoose
 * model -> MongoDB -> HTTP response — actually works, which is what
 * "frontend -> backend -> database" means once Akiti's UI is calling
 * these same endpoints.
 *
 * IMPORTANT — route assumptions:
 * This script assumes Siddhi's pipeline API follows the same REST
 * convention as the existing `jobs` routes (src/routes/job.routes.js):
 *
 *   POST   /api/pipelines            create/save a pipeline config
 *   GET    /api/pipelines/:id        load a pipeline config
 *   GET    /api/pipelines            list pipeline configs
 *   POST   /api/pipelines/:id/run    trigger a run
 *   GET    /api/pipelines/:id/runs   list run history for a pipeline
 *
 * If Siddhi's actual routes differ, edit the ENDPOINTS block below to
 * match — everything else in this script stays the same. Each check is
 * independent and SKIPs (rather than fails) if its endpoint 404s, so this
 * is safe to run before every route exists yet, and becomes fully green
 * as Siddhi's API lands.
 *
 * Usage:
 *   node scripts/testIntegrationApi.js
 *   BASE_URL=http://localhost:5000 node scripts/testIntegrationApi.js
 */

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

const ENDPOINTS = {
  createPipeline: () => `${BASE_URL}/api/pipelines`,
  getPipeline: (id) => `${BASE_URL}/api/pipelines/${id}`,
  listPipelines: () => `${BASE_URL}/api/pipelines`,
  runPipeline: (id) => `${BASE_URL}/api/pipelines/${id}/run`,
  listRuns: (id) => `${BASE_URL}/api/pipelines/${id}/runs`,
};

const results = [];
function record(label, status, detail = '') {
  // status: 'pass' | 'fail' | 'skip'
  results.push({ label, status });
  const icon = { pass: '✅', fail: '❌', skip: '⏭️ ' }[status];
  console.log(`${icon} ${label}${detail ? ` — ${detail}` : ''}`);
}

async function safeFetch(url, options) {
  try {
    const res = await fetch(url, options);
    return { res, reachable: true };
  } catch (err) {
    return { res: null, reachable: false, error: err };
  }
}

async function main() {
  console.log(`--- Integration test: HTTP -> backend -> database (${BASE_URL}) ---\n`);

  // 0. Is the server even up?
  const health = await safeFetch(`${BASE_URL}/health`);
  if (!health.reachable) {
    record(
      'Server reachable',
      'fail',
      `Could not reach ${BASE_URL} — start the backend first (npm run dev)`
    );
    return summarize();
  }
  record('Server reachable', health.res.ok ? 'pass' : 'fail', `HTTP ${health.res.status}`);

  // 1. Create pipeline via API (exercises Siddhi's save endpoint + PipelineConfig model)
  let createdId = null;
  const createRes = await safeFetch(ENDPOINTS.createPipeline(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '__integration_test__ pipeline',
      source: { type: 'csv_upload', config: { fileName: 'test.csv' } },
      transformations: [],
      destination: { type: 'mongodb_collection', config: { collection: 'test_out' } },
    }),
  });
  if (!createRes.reachable) {
    record('Create pipeline (POST /api/pipelines)', 'fail', createRes.error.message);
  } else if (createRes.res.status === 404) {
    record('Create pipeline (POST /api/pipelines)', 'skip', 'endpoint not implemented yet');
  } else {
    const ok = createRes.res.status === 200 || createRes.res.status === 201;
    record('Create pipeline (POST /api/pipelines)', ok ? 'pass' : 'fail', `HTTP ${createRes.res.status}`);
    if (ok) {
      const body = await createRes.res.json().catch(() => null);
      createdId = body?._id || body?.id || body?.data?._id || null;
    }
  }

  // 2. Load it back via API (exercises Siddhi's load endpoint)
  if (createdId) {
    const getRes = await safeFetch(ENDPOINTS.getPipeline(createdId));
    const ok = getRes.reachable && getRes.res.ok;
    record('Load pipeline by id (GET /api/pipelines/:id)', ok ? 'pass' : 'fail', getRes.reachable ? `HTTP ${getRes.res.status}` : getRes.error.message);
  } else {
    record('Load pipeline by id (GET /api/pipelines/:id)', 'skip', 'no pipeline id from previous step');
  }

  // 3. Trigger a run (exercises Siddhi's Run API + PipelineRun model, Week 3)
  let runId = null;
  if (createdId) {
    const runRes = await safeFetch(ENDPOINTS.runPipeline(createdId), { method: 'POST' });
    if (!runRes.reachable) {
      record('Trigger run (POST /api/pipelines/:id/run)', 'fail', runRes.error.message);
    } else if (runRes.res.status === 404) {
      record('Trigger run (POST /api/pipelines/:id/run)', 'skip', 'endpoint not implemented yet (Week 3)');
    } else {
      const ok = runRes.res.status === 200 || runRes.res.status === 201 || runRes.res.status === 202;
      record('Trigger run (POST /api/pipelines/:id/run)', ok ? 'pass' : 'fail', `HTTP ${runRes.res.status}`);
      if (ok) {
        const body = await runRes.res.json().catch(() => null);
        runId = body?._id || body?.id || body?.data?._id || null;
      }
    }
  } else {
    record('Trigger run (POST /api/pipelines/:id/run)', 'skip', 'no pipeline id from previous step');
  }

  // 4. List run history (Week 3 Run History page's data source)
  if (createdId) {
    const historyRes = await safeFetch(ENDPOINTS.listRuns(createdId));
    if (!historyRes.reachable) {
      record('List run history (GET /api/pipelines/:id/runs)', 'fail', historyRes.error.message);
    } else if (historyRes.res.status === 404) {
      record('List run history (GET /api/pipelines/:id/runs)', 'skip', 'endpoint not implemented yet (Week 3)');
    } else {
      record('List run history (GET /api/pipelines/:id/runs)', historyRes.res.ok ? 'pass' : 'fail', `HTTP ${historyRes.res.status}`);
    }
  } else {
    record('List run history (GET /api/pipelines/:id/runs)', 'skip', 'no pipeline id from previous step');
  }

  // 5. Week 1 feature still works (no regression from Week 2/3 changes)
  const jobsRes = await safeFetch(`${BASE_URL}/api/jobs`);
  record(
    'Week 1 regression check: GET /api/jobs still responds',
    jobsRes.reachable && jobsRes.res.ok ? 'pass' : 'fail',
    jobsRes.reachable ? `HTTP ${jobsRes.res.status}` : jobsRes.error.message
  );

  summarize();
}

function summarize() {
  const failed = results.filter((r) => r.status === 'fail');
  const skipped = results.filter((r) => r.status === 'skip');
  const passed = results.filter((r) => r.status === 'pass');
  console.log(
    `\n${passed.length} passed, ${failed.length} failed, ${skipped.length} skipped (endpoint not built yet)`
  );
  console.log('Log any ❌ above in docs/BUG_LOG.md.');
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error('Unexpected error running integration test:', err);
  process.exit(1);
});
