import mongoose from 'mongoose';
import { Pipeline } from '../models/Pipeline.js';
import { PipelineRun } from '../models/PipelineRun.js';
import { SourceUpload } from '../models/SourceUpload.js';
import { PIPELINE_RUN_STATUS } from '../config/constants.js';
import { AppError } from '../utils/AppError.js';
import { validateRunPayload } from '../utils/validation.js';
const valid = id => mongoose.Types.ObjectId.isValid(id);

export function pipelineRunController({ executePipeline, logger }) {
  return {
    run: async (req, res, next) => {
      try {
        if (!valid(req.params.id)) throw new AppError('Invalid pipeline id.', 400, 'INVALID_PIPELINE_ID');
        const { sourceJobId } = validateRunPayload(req.body);
        const sourceUpload = await SourceUpload.findOne({ jobId: sourceJobId, owner: req.user.sub });
        if (!sourceUpload) throw new AppError('Source upload not found for this user.', 404, 'SOURCE_NOT_FOUND');
        const pipeline = await Pipeline.findOne({ _id: req.params.id, owner: req.user.sub });
        if (!pipeline) throw new AppError('Pipeline not found.', 404, 'PIPELINE_NOT_FOUND');
        const run = await PipelineRun.create({
          pipeline: pipeline._id, owner: req.user.sub, sourceJobId,
          destinationCollection: `${pipeline.destination?.collectionPrefix || 'etl_'}run_${new mongoose.Types.ObjectId()}`,
          status: PIPELINE_RUN_STATUS.RUNNING, startedAt: new Date(),
          steps: [
            { name: 'Source', type: 'csv-upload', status: PIPELINE_RUN_STATUS.RUNNING, startedAt: new Date() },
            { name: 'Transformation', type: 'mapping', status: PIPELINE_RUN_STATUS.RUNNING, startedAt: new Date() },
            { name: 'Destination', type: 'mongodb', status: PIPELINE_RUN_STATUS.RUNNING, startedAt: new Date() }
          ]
        });
        logger.info('pipeline.run.triggered', { runId: run.id, pipelineId: pipeline.id, sourceJobId, status: run.status });
        setImmediate(() => executePipeline({ pipeline, runId: run.id, sourceJobId }).catch(error => logger.error('pipeline.run.unhandled_error', { runId: run.id, error: error.stack || String(error) })));
        res.status(202).json({ success: true, message: 'Pipeline execution started.', run: { id: run.id, pipelineId: pipeline.id, status: run.status, sourceJobId, startedAt: run.startedAt } });
      } catch (error) { next(error); }
    },
    getStatus: async (req, res, next) => {
      try {
        if (!valid(req.params.id) || !valid(req.params.runId)) throw new AppError('Invalid pipeline or run id.', 400, 'INVALID_ID');
        const run = await PipelineRun.findOne({ _id: req.params.runId, pipeline: req.params.id, owner: req.user.sub });
        if (!run) throw new AppError('Pipeline run not found.', 404, 'RUN_NOT_FOUND');
        res.json({ success: true, run });
      } catch (error) { next(error); }
    }
  };
}
