import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { processCsv } from './etlPipeline.js';
import { PipelineRun } from '../models/PipelineRun.js';
import { PIPELINE_RUN_STATUS, MAX_ROWS_PER_RUN } from '../config/constants.js';
import { AppError } from '../utils/AppError.js';

const clientMessage = error => error?.name === 'AppError' ? error.message : 'Pipeline execution failed. Check the execution logs for details.';

export function createPipelineExecutor({ uploadDir, io, logger }) {
  return async function executePipeline({ pipeline, runId, sourceJobId }) {
    const run = await PipelineRun.findById(runId);
    if (!run) throw new AppError('Pipeline run not found.', 404, 'RUN_NOT_FOUND');
    try {
      const root = path.resolve(uploadDir); const file = path.resolve(root, `${sourceJobId}.csv`);
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) throw new AppError('Source upload was not found.', 404, 'SOURCE_NOT_FOUND');
      logger.info('pipeline.step.started', { runId, pipelineId: pipeline.id, step: 'source' });
      run.steps[0].status = PIPELINE_RUN_STATUS.SUCCESS; run.steps[0].completedAt = new Date(); await run.save();
      logger.info('pipeline.step.completed', { runId, step: 'source' });
      for (const i of [1, 2]) { run.steps[i].status = PIPELINE_RUN_STATUS.RUNNING; run.steps[i].startedAt = new Date(); }
      await run.save(); logger.info('pipeline.step.started', { runId, pipelineId: pipeline.id, step: 'transformation' }); logger.info('pipeline.step.started', { runId, pipelineId: pipeline.id, step: 'destination' });
      const collection = mongoose.connection.db.collection(run.destinationCollection);
      const sourceStream = fs.createReadStream(file);
      sourceStream.totalBytes = fs.statSync(file).size;
      const result = await processCsv({ source: sourceStream, collection, mappings: pipeline.mappings, batchSize: pipeline.batchSize, maxRows: MAX_ROWS_PER_RUN, onProgress: progress => { if (progress.processed !== undefined) { run.processedRows = progress.processed; run.steps[1].processedRows = progress.processed; } if (progress.inserted !== undefined) { run.insertedRows = progress.inserted; run.steps[2].insertedRows = progress.inserted; } if (progress.failed !== undefined) { run.failedRowCount = progress.failed; } if (progress.failedRow) { if (run.failedRows.length < 500) run.failedRows.push(progress.failedRow); } io?.emit(`pipeline-run:${run.id}`, { runId: run.id, status: PIPELINE_RUN_STATUS.RUNNING, ...progress }); } });
      const completedAt = new Date(); for (const i of [1, 2]) { run.steps[i].status = PIPELINE_RUN_STATUS.SUCCESS; run.steps[i].completedAt = completedAt; } run.status = PIPELINE_RUN_STATUS.SUCCESS; run.completedAt = completedAt; run.processedRows = result.processed; run.insertedRows = result.inserted; run.failedRowCount = result.failed; run.failedRows = result.failedRows; run.error = { code: null, message: null }; await run.save();
      logger.info('pipeline.run.completed', { runId, pipelineId: pipeline.id, status: run.status, ...result }); io?.emit(`pipeline-run:${run.id}`, { runId: run.id, status: run.status, percent: 100, ...result }); return run;
    } catch (error) {
      const message = clientMessage(error); const code = error?.code || (error?.status === 404 ? 'SOURCE_NOT_FOUND' : 'EXECUTION_FAILED'); const failedAt = new Date();
      run.status = PIPELINE_RUN_STATUS.FAILED; run.completedAt = failedAt; run.error = { code, message }; for (const step of run.steps) if (step.status === PIPELINE_RUN_STATUS.RUNNING) { step.status = PIPELINE_RUN_STATUS.FAILED; step.completedAt = failedAt; step.error = message; } await run.save();
      logger.error('pipeline.run.failed', { runId, pipelineId: pipeline.id, status: run.status, errorCode: code, error: error?.stack || String(error) }); io?.emit(`pipeline-run:${run.id}`, { runId, status: run.status, error: { code, message } }); return run;
    }
  };
}
