/**
 * scripts/testPipelineRun.js
 *
 * Week 3 database tasks:
 *   - "Connect Run History table with backend Run API" (verified at the
 *     model layer here; wire the same calls into Siddhi's Run controller)
 *   - "Write test cases covering pipeline execution and failure scenarios"
 *   - "Execute test cases and log results"
 *
 * Creates a temporary PipelineConfig, then runs it through:
 *   1. A successful run lifecycle (running -> success)
 *   2. A failed run lifecycle (running -> failed, with a structured error
 *      and log trail)
 *   3. Run History queries (list runs for a pipeline, newest first)
 * ...then cleans up everything it created.
 *
 * Usage:
 *   node scripts/testPipelineRun.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const PipelineConfig = require('../src/models/PipelineConfig.model');
const PipelineRun = require('../src/models/PipelineRun.model');

const results = [];
function record(label, pass, detail = '') {
  results.push({ label, pass });
  console.log(`${pass ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('--- PipelineRun (Run History) execution & failure test cases ---\n');
  await connectDB();

  const pipeline = await PipelineConfig.create({
    name: '__test__ run history pipeline',
    source: { type: 'csv_upload', config: { fileName: 'orders.csv' } },
    transformations: [{ type: 'filter', order: 0, params: { field: 'amount', op: 'gt', value: 0 } }],
    destination: { type: 'mongodb_collection', config: { collection: 'orders_clean' } },
  });

  // --- Test case 1: successful run lifecycle ---
  let successRun;
  try {
    successRun = await PipelineRun.create({ pipeline: pipeline._id, status: 'running' });
    successRun.logs.push({ level: 'info', step: 'source', message: 'Read 100 rows from orders.csv' });
    successRun.logs.push({ level: 'info', step: 'transformation', message: 'Filtered to 92 rows (amount > 0)' });
    successRun.logs.push({ level: 'info', step: 'destination', message: 'Inserted 92 rows into orders_clean' });
    successRun.rowsProcessed = 100;
    successRun.rowsSucceeded = 92;
    successRun.rowsFailed = 8;
    successRun.status = 'success';
    successRun.completedAt = new Date();
    await successRun.save();

    const reloaded = await PipelineRun.findById(successRun._id);
    record(
      'TC-1: Successful run reaches status=success with 3 log entries',
      reloaded.status === 'success' && reloaded.logs.length === 3
    );
  } catch (err) {
    record('TC-1: Successful run reaches status=success with 3 log entries', false, err.message);
  }

  // --- Test case 2: failed run lifecycle, structured error ---
  let failedRun;
  try {
    failedRun = await PipelineRun.create({ pipeline: pipeline._id, status: 'running' });
    failedRun.logs.push({ level: 'info', step: 'source', message: 'Read 50 rows from orders.csv' });
    failedRun.logs.push({
      level: 'error',
      step: 'transformation',
      message: 'Filter step crashed: field "amount" missing on row 17',
    });
    failedRun.status = 'failed';
    failedRun.error = { step: 'transformation', message: 'Field "amount" missing on row 17' };
    failedRun.rowsProcessed = 50;
    failedRun.rowsSucceeded = 0;
    failedRun.rowsFailed = 50;
    failedRun.completedAt = new Date();
    await failedRun.save();

    const reloaded = await PipelineRun.findById(failedRun._id);
    record(
      'TC-2: Failed run stores structured error {step, message}',
      reloaded.status === 'failed' &&
        reloaded.error.step === 'transformation' &&
        !!reloaded.error.message
    );
  } catch (err) {
    record('TC-2: Failed run stores structured error {step, message}', false, err.message);
  }

  // --- Test case 3: Run History query — newest first for a pipeline ---
  try {
    const history = await PipelineRun.find({ pipeline: pipeline._id }).sort({ startedAt: -1 });
    const newestFirst =
      history.length === 2 && history[0].startedAt.getTime() >= history[1].startedAt.getTime();
    record('TC-3: Run History lists both runs, newest first', newestFirst);
  } catch (err) {
    record('TC-3: Run History lists both runs, newest first', false, err.message);
  }

  // --- Test case 4: a pipeline with zero runs returns an empty history, not an error ---
  try {
    const emptyPipeline = await PipelineConfig.create({
      name: '__test__ never-run pipeline',
      source: { type: 'csv_upload', config: {} },
      destination: { type: 'mongodb_collection', config: { collection: 'x' } },
    });
    const history = await PipelineRun.find({ pipeline: emptyPipeline._id });
    record('TC-4: Never-run pipeline returns empty Run History (not an error)', Array.isArray(history) && history.length === 0);
    await PipelineConfig.deleteOne({ _id: emptyPipeline._id });
  } catch (err) {
    record('TC-4: Never-run pipeline returns empty Run History (not an error)', false, err.message);
  }

  // --- cleanup ---
  await PipelineRun.deleteMany({ pipeline: pipeline._id });
  await PipelineConfig.deleteOne({ _id: pipeline._id });

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} test cases passed`);
  await mongoose.connection.close();
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
