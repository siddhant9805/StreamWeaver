/**
 * scripts/testPipelineConfig.js
 *
 * Week 2 database task: "Test saving and retrieving pipeline configuration."
 *
 * Exercises the PipelineConfig model directly (this is the database layer
 * Siddhi's save/load API controllers will sit on top of) with a realistic
 * Source -> Transformation -> Destination shape, and prints a ✅/❌ report.
 *
 * Usage:
 *   node scripts/testPipelineConfig.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const PipelineConfig = require('../src/models/PipelineConfig.model');

const results = [];
function record(label, pass, detail = '') {
  results.push({ label, pass });
  console.log(`${pass ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('--- PipelineConfig save/retrieve test ---\n');
  await connectDB();

  let saved;
  try {
    saved = await PipelineConfig.create({
      name: '__test__ customers pipeline',
      description: 'Reads uploaded CSV, uppercases first name, writes to customers_clean',
      status: 'draft',
      source: { type: 'csv_upload', config: { fileName: 'customers.csv' } },
      transformations: [
        { type: 'map', order: 0, params: { field: 'first_name', op: 'uppercase' } },
      ],
      destination: { type: 'mongodb_collection', config: { collection: 'customers_clean' } },
    });
    record('Save pipeline configuration', !!saved._id, saved._id.toString());
  } catch (err) {
    record('Save pipeline configuration', false, err.message);
    return finish();
  }

  try {
    const loaded = await PipelineConfig.findById(saved._id);
    const shapeOk =
      loaded &&
      loaded.name === saved.name &&
      loaded.source.type === 'csv_upload' &&
      loaded.transformations.length === 1 &&
      loaded.destination.type === 'mongodb_collection';
    record('Retrieve pipeline configuration by id', shapeOk);
  } catch (err) {
    record('Retrieve pipeline configuration by id', false, err.message);
  }

  try {
    const updated = await PipelineConfig.findByIdAndUpdate(
      saved._id,
      { status: 'active' },
      { new: true }
    );
    record('Update pipeline configuration (draft -> active)', updated.status === 'active');
  } catch (err) {
    record('Update pipeline configuration (draft -> active)', false, err.message);
  }

  try {
    const list = await PipelineConfig.find({ status: 'active' }).limit(5);
    record('List pipelines filtered by status (uses status index)', list.some((p) => String(p._id) === String(saved._id)));
  } catch (err) {
    record('List pipelines filtered by status (uses status index)', false, err.message);
  }

  try {
    await PipelineConfig.deleteOne({ _id: saved._id });
    const gone = await PipelineConfig.findById(saved._id);
    record('Delete pipeline configuration', gone === null);
  } catch (err) {
    record('Delete pipeline configuration', false, err.message);
  }

  await finish();
}

async function finish() {
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  await mongoose.connection.close();
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
