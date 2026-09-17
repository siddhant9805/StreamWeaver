import test from 'node:test';
import assert from 'node:assert/strict';
import { PIPELINE_RUN_STATUS } from '../src/config/constants.js';
import { validateRunPayload, validatePipelinePayload } from '../src/utils/validation.js';
import { AppError } from '../src/utils/AppError.js';

test('Week 3 status contract', () => {
  assert.deepEqual(PIPELINE_RUN_STATUS, { RUNNING: 'RUNNING', SUCCESS: 'SUCCESS', FAILED: 'FAILED' });
});

test('run payload requires a valid source upload job id', () => {
  assert.deepEqual(validateRunPayload({ sourceJobId: '550e8400-e29b-41d4-a716-446655440000' }), { sourceJobId: '550e8400-e29b-41d4-a716-446655440000' });
  assert.throws(() => validateRunPayload({}), (error) => error instanceof AppError && error.status === 400 && error.code === 'VALIDATION_ERROR');
  assert.throws(() => validateRunPayload({ sourceJobId: 'bad-id' }), /valid upload job id/);
});

test('simple, transformed and invalid pipeline configurations are handled', () => {
  const simple = validatePipelinePayload({ name: 'Simple', mappings: [{ source: 'name', destination: 'name' }] });
  assert.equal(simple.source.type, 'csv-upload');
  assert.equal(simple.destination.type, 'mongodb');
  assert.equal(simple.batchSize, 5000);

  const transformed = validatePipelinePayload({ name: 'Clean data', mappings: [{ source: 'email', destination: 'email', transform: 'value => value.trim().toLowerCase()' }], batchSize: 500 });
  assert.equal(transformed.mappings[0].transform, 'value => value.trim().toLowerCase()');
  assert.equal(transformed.batchSize, 500);

  assert.throws(() => validatePipelinePayload({ name: 'Bad', mappings: [{ source: 'a' }] }), /destination is required/);
  assert.throws(() => validatePipelinePayload({ name: 'Bad source', mappings: [{ source: 'a', destination: 'b' }], source: { type: 'mysql' } }), (e) => e.code === 'UNSUPPORTED_SOURCE');
  assert.throws(() => validatePipelinePayload({ name: 'Bad destination', mappings: [{ source: 'a', destination: 'b' }], destination: { type: 'postgres' } }), (e) => e.code === 'UNSUPPORTED_DESTINATION');
});
