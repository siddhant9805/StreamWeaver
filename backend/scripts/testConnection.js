/**
 * scripts/testConnection.js
 *
 * Week 1 database task: "Test database, update README and upload final code."
 *
 * Verifies, end to end, that the database layer the rest of the app relies
 * on actually works:
 *   1. Connects using the exact same connectDB() the real server uses
 *   2. Confirms both collections are reachable
 *   3. Confirms the indexes declared in the schemas are actually built
 *   4. Performs a real insert -> read -> delete round trip on each model
 *
 * Usage:
 *   node scripts/testConnection.js
 *
 * Exits with code 0 if everything passes, 1 if anything fails (so it can
 * also be wired into CI later).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Job = require('../src/models/Job.model');
const FailedRow = require('../src/models/FailedRow.model');

const results = [];

function record(label, pass, detail = '') {
  results.push({ label, pass, detail });
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} ${label}${detail ? ` — ${detail}` : ''}`);
}

async function checkIndexes(model, expectedKeys, label) {
  const indexes = await model.collection.indexes();
  const indexKeySets = indexes.map((ix) => Object.keys(ix.key).join(','));
  const missing = expectedKeys.filter((k) => !indexKeySets.includes(k));
  record(
    `${label} indexes present`,
    missing.length === 0,
    missing.length ? `missing: ${missing.join(' | ')}` : `found: ${indexKeySets.join(' ; ')}`
  );
}

async function main() {
  console.log('--- StreamWeaver database connectivity & schema test ---\n');

  // 1. Connection
  try {
    await connectDB();
    record('Connected to MongoDB', true, mongoose.connection.name);
  } catch (err) {
    record('Connected to MongoDB', false, err.message);
    printSummaryAndExit();
    return;
  }

  // 2. Collections reachable
  try {
    await Job.collection.stats().catch(() => Job.estimatedDocumentCount());
    record('"jobs" collection reachable', true);
  } catch (err) {
    record('"jobs" collection reachable', false, err.message);
  }

  try {
    await FailedRow.collection.stats().catch(() => FailedRow.estimatedDocumentCount());
    record('"failedrows" collection reachable', true);
  } catch (err) {
    record('"failedrows" collection reachable', false, err.message);
  }

  // 3. Indexes
  await checkIndexes(Job, ['status'], '"jobs"');
  await checkIndexes(FailedRow, ['job', 'job,rowNumber'], '"failedrows"');

  // 4. Round-trip write/read/delete on Job
  let testJob;
  try {
    testJob = await Job.create({
      originalFileName: '__connection_test__.csv',
      tempFilePath: '/tmp/__connection_test__.csv',
      targetCollection: 'connection_test_output',
      status: 'uploaded',
      headers: ['a', 'b'],
    });
    const found = await Job.findById(testJob._id);
    record('Job insert + read round trip', !!found);
  } catch (err) {
    record('Job insert + read round trip', false, err.message);
  }

  // 5. Round-trip write/read/delete on FailedRow, using the ref to testJob
  if (testJob) {
    try {
      const testFailedRow = await FailedRow.create({
        job: testJob._id,
        rowNumber: 1,
        rawData: { foo: 'bar' },
        reason: 'connection test row',
      });
      const found = await FailedRow.findById(testFailedRow._id).populate('job');
      record(
        'FailedRow insert + read + populate("job") round trip',
        !!found && String(found.job._id) === String(testJob._id)
      );
      await FailedRow.deleteOne({ _id: testFailedRow._id });
    } catch (err) {
      record('FailedRow insert + read + populate("job") round trip', false, err.message);
    }

    await Job.deleteOne({ _id: testJob._id });
  }

  printSummaryAndExit();
}

function printSummaryAndExit() {
  const failed = results.filter((r) => !r.pass);
  console.log('\n--- Summary ---');
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  mongoose.connection.close().finally(() => {
    process.exit(failed.length ? 1 : 0);
  });
}

main().catch((err) => {
  console.error('Unexpected error while running database tests:', err);
  process.exit(1);
});
