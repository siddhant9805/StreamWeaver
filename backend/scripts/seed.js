/**
 * scripts/seed.js
 *
 * Week 1 database task: "Insert sample data and verify database."
 *
 * Inserts a small, realistically-shaped set of sample documents so the
 * frontend/dashboard can be built against real data without needing a real
 * CSV upload first.
 *
 * Usage:
 *   node scripts/seed.js          # insert sample data
 *   node scripts/seed.js --clean  # remove only the sample data this script created
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Job = require('../src/models/Job.model');
const FailedRow = require('../src/models/FailedRow.model');
const PipelineConfig = require('../src/models/PipelineConfig.model');
const PipelineRun = require('../src/models/PipelineRun.model');

// Tag every doc this script creates so --clean only ever removes seed data,
// never anything a teammate created through the real app.
const SEED_TAG = '__seed__';

async function clean() {
  const jobs = await Job.find({ originalFileName: { $regex: `^${SEED_TAG}` } });
  const jobIds = jobs.map((j) => j._id);
  const { deletedCount: rowsDeleted } = await FailedRow.deleteMany({ job: { $in: jobIds } });
  const { deletedCount: jobsDeleted } = await Job.deleteMany({ _id: { $in: jobIds } });
  console.log(`Removed ${jobsDeleted} seed job(s) and ${rowsDeleted} seed failed row(s).`);

  const pipelines = await PipelineConfig.find({ name: { $regex: `^${SEED_TAG}` } });
  const pipelineIds = pipelines.map((p) => p._id);
  const { deletedCount: runsDeleted } = await PipelineRun.deleteMany({ pipeline: { $in: pipelineIds } });
  const { deletedCount: pipelinesDeleted } = await PipelineConfig.deleteMany({ _id: { $in: pipelineIds } });
  console.log(`Removed ${pipelinesDeleted} seed pipeline(s) and ${runsDeleted} seed run(s).`);
}

async function seed() {
  const completedJob = await Job.create({
    originalFileName: `${SEED_TAG}_customers_clean.csv`,
    tempFilePath: '/tmp/uploads/seed-completed.csv',
    targetCollection: 'customers_clean',
    status: 'completed',
    headers: ['first_name', 'last_name', 'age', 'email'],
    sampleRows: [
      { first_name: 'Asha', last_name: 'Rao', age: '29', email: 'asha@example.com' },
      { first_name: 'Ben', last_name: 'Lee', age: '34', email: 'ben@example.com' },
    ],
    mapping: [
      { source: 'first_name', destination: 'firstName', transformCode: 'return value.trim()' },
      { source: 'last_name', destination: 'lastName', transformCode: null },
      { source: 'age', destination: 'age', transformCode: 'return Number(value)' },
      { source: 'email', destination: 'email', transformCode: 'return value.toLowerCase()' },
    ],
    validation: [
      { field: 'firstName', required: true, type: 'string' },
      { field: 'age', required: true, type: 'number' },
    ],
    totalRowsEstimate: 5000,
    processedRows: 5000,
    insertedRows: 4890,
    failedRows: 110,
    rowsPerSecond: 1420,
    startedAt: new Date(Date.now() - 1000 * 60 * 6),
    completedAt: new Date(),
  });

  const failedJob = await Job.create({
    originalFileName: `${SEED_TAG}_inventory_dirty.csv`,
    tempFilePath: '/tmp/uploads/seed-failed.csv',
    targetCollection: 'inventory_clean',
    status: 'failed',
    headers: ['sku', 'qty', 'warehouse'],
    mapping: [
      { source: 'sku', destination: 'sku', transformCode: null },
      { source: 'qty', destination: 'quantity', transformCode: 'return Number(value)' },
    ],
    validation: [
      { field: 'sku', required: true, type: 'string' },
      { field: 'quantity', required: true, type: 'number' },
    ],
    totalRowsEstimate: 200,
    processedRows: 45,
    insertedRows: 40,
    failedRows: 5,
    errorMessage: 'Sandbox transform timed out on row 46 (seed data — simulated failure).',
    startedAt: new Date(Date.now() - 1000 * 60 * 20),
    completedAt: new Date(Date.now() - 1000 * 60 * 18),
  });

  const sampleFailedRows = [
    { job: failedJob._id, rowNumber: 12, rawData: { sku: '', qty: '10' }, reason: 'Required field "sku" is missing' },
    { job: failedJob._id, rowNumber: 27, rawData: { sku: 'A-1092', qty: 'ten' }, reason: 'Field "quantity" is not a number' },
    { job: failedJob._id, rowNumber: 33, rawData: { sku: 'B-2201', qty: '-5' }, reason: 'Field "quantity" failed custom validation (negative)' },
    { job: failedJob._id, rowNumber: 46, rawData: { sku: 'C-0099', qty: '3' }, reason: 'Sandbox transform timed out' },
    { job: failedJob._id, rowNumber: 51, rawData: { sku: null, qty: '7' }, reason: 'Required field "sku" is missing' },
  ];
  await FailedRow.insertMany(sampleFailedRows);

  console.log('Seeded (Week 1 — Job / FailedRow):');
  console.log(`  - 1 completed job (${completedJob.originalFileName})`);
  console.log(`  - 1 failed job (${failedJob.originalFileName})`);
  console.log(`  - ${sampleFailedRows.length} failed rows linked to the failed job`);

  // --- Week 2/3 — PipelineConfig / PipelineRun (Run History) ---
  const activePipeline = await PipelineConfig.create({
    name: `${SEED_TAG}_customer_cleanup_pipeline`,
    description: 'Uppercases first name, filters out zero-amount rows, writes to customers_clean',
    status: 'active',
    source: { type: 'csv_upload', config: { fileName: 'customers.csv' } },
    transformations: [
      { type: 'map', order: 0, params: { field: 'first_name', op: 'uppercase' } },
      { type: 'filter', order: 1, params: { field: 'amount', op: 'gt', value: 0 } },
    ],
    destination: { type: 'mongodb_collection', config: { collection: 'customers_clean' } },
    lastRunStatus: 'success',
    lastRunAt: new Date(Date.now() - 1000 * 60 * 3),
    totalRuns: 2,
  });

  const draftPipeline = await PipelineConfig.create({
    name: `${SEED_TAG}_inventory_pipeline_draft`,
    description: 'Not run yet — still being configured in the Pipeline Builder',
    status: 'draft',
    source: { type: 'csv_upload', config: { fileName: 'inventory.csv' } },
    destination: { type: 'mongodb_collection', config: { collection: 'inventory_clean' } },
  });

  await PipelineRun.create([
    {
      pipeline: activePipeline._id,
      status: 'success',
      rowsProcessed: 100,
      rowsSucceeded: 92,
      rowsFailed: 8,
      logs: [
        { level: 'info', step: 'source', message: 'Read 100 rows from customers.csv' },
        { level: 'info', step: 'transformation', message: 'Filtered to 92 rows (amount > 0)' },
        { level: 'info', step: 'destination', message: 'Inserted 92 rows into customers_clean' },
      ],
      startedAt: new Date(Date.now() - 1000 * 60 * 10),
      completedAt: new Date(Date.now() - 1000 * 60 * 9),
    },
    {
      pipeline: activePipeline._id,
      status: 'failed',
      rowsProcessed: 40,
      rowsSucceeded: 0,
      rowsFailed: 40,
      error: { step: 'transformation', message: 'Field "amount" missing on row 12 (seed data)' },
      logs: [
        { level: 'info', step: 'source', message: 'Read 40 rows from customers.csv' },
        { level: 'error', step: 'transformation', message: 'Field "amount" missing on row 12' },
      ],
      startedAt: new Date(Date.now() - 1000 * 60 * 3),
      completedAt: new Date(Date.now() - 1000 * 60 * 2),
    },
  ]);

  console.log('Seeded (Week 2/3 — PipelineConfig / PipelineRun):');
  console.log(`  - 1 active pipeline with 2 runs (1 success, 1 failed): ${activePipeline.name}`);
  console.log(`  - 1 draft pipeline with 0 runs: ${draftPipeline.name}`);
}

async function main() {
  await connectDB();

  if (process.argv.includes('--clean')) {
    await clean();
  } else {
    await seed();
  }

  await mongoose.connection.close();
}

main().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
