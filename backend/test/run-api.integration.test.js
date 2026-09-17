import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Pipeline } from '../src/models/Pipeline.js';
import { PipelineRun } from '../src/models/PipelineRun.js';

const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/streamweaver_test';
const env = { jwtSecret: 'test-only-secret', clientOrigin: 'http://localhost:5173', uploadDir: 'test-uploads', logDir: 'test-logs' };
const io = { emit: () => {} };
let app; let mongoAvailable = true;

test.before(async () => {
  try { await mongoose.connect(TEST_MONGODB_URI, { serverSelectionTimeoutMS: 1500 }); app = createApp(env, io, { logger: { info() {}, warn() {}, error() {} }, executePipeline: async () => {} }); }
  catch { mongoAvailable = false; }
});
test.after(async () => { if (!mongoAvailable) return; await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

test('Run API creates a RUNNING PipelineRun and returns 202', async (t) => {
  if (!mongoAvailable) { t.skip(`No MongoDB reachable at ${TEST_MONGODB_URI}.`); return; }
  await User.deleteMany({}); await Pipeline.deleteMany({}); await PipelineRun.deleteMany({});
  const register = await request(app).post('/api/auth/register').send({ name: 'Run Tester', email: 'run-tester@example.com', password: 'strong-password' });
  assert.equal(register.status, 201);
  const token = register.body.token;
  const saved = await request(app).post('/api/pipelines').set('Authorization', `Bearer ${token}`).send({ name: 'Customer pipeline', mappings: [{ source: 'email', destination: 'email' }] });
  assert.equal(saved.status, 201);
  const run = await request(app).post(`/api/pipelines/${saved.body.pipeline._id}/run`).set('Authorization', `Bearer ${token}`).send({ sourceJobId: '550e8400-e29b-41d4-a716-446655440000' });
  assert.equal(run.status, 202); assert.equal(run.body.success, true); assert.equal(run.body.run.status, 'RUNNING');
  const status = await request(app).get(`/api/pipelines/${saved.body.pipeline._id}/runs/${run.body.run.id}`).set('Authorization', `Bearer ${token}`);
  assert.equal(status.status, 200); assert.equal(status.body.run.status, 'RUNNING');
});

test('Run API returns standardized validation errors', async (t) => {
  if (!mongoAvailable) { t.skip(`No MongoDB reachable at ${TEST_MONGODB_URI}.`); return; }
  const register = await request(app).post('/api/auth/register').send({ name: 'Validation Tester', email: 'validation-tester@example.com', password: 'strong-password' });
  const token = register.body.token;
  const user = await User.findOne({ email: 'validation-tester@example.com' });
  const pipeline = await Pipeline.create({ owner: user._id, name: 'Validation pipeline', mappings: [{ source: 'a', destination: 'b' }] });
  const response = await request(app).post(`/api/pipelines/${pipeline.id}/run`).set('Authorization', `Bearer ${token}`).send({});
  assert.equal(response.status, 400); assert.equal(response.body.success, false); assert.equal(response.body.error.code, 'VALIDATION_ERROR'); assert.ok(response.body.error.message);
});
