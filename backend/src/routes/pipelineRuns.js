import { Router } from 'express';
import { pipelineRunController } from '../controllers/pipelineRun.controller.js';
import { PipelineRun } from '../models/PipelineRun.js';

export function pipelineRunRouter({ executePipeline, logger }) {
  const router = Router();
  const controller = pipelineRunController({ executePipeline, logger });

  // Get full execution history for the logged-in user
  router.get('/runs/history', async (req, res, next) => {
    try {
      const runs = await PipelineRun.find({ owner: req.user.sub })
        .populate('pipeline', 'name')
        .sort({ startedAt: -1 })
        .limit(100)
        .lean();
      res.json({ success: true, runs });
    } catch (error) {
      next(error);
    }
  });

  // Get runs for a specific pipeline
  router.get('/:id/runs', async (req, res, next) => {
    try {
      const runs = await PipelineRun.find({ pipeline: req.params.id, owner: req.user.sub })
        .sort({ startedAt: -1 })
        .lean();
      res.json({ success: true, runs });
    } catch (error) {
      next(error);
    }
  });

  // Trigger a pipeline run
  router.post('/:id/run', controller.run);

  // Get status of a specific run
  router.get('/:id/runs/:runId', controller.getStatus);

  return router;
}
