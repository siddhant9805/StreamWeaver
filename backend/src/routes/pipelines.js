import { Router } from 'express';
import mongoose from 'mongoose';
import { Pipeline } from '../models/Pipeline.js';
import { validatePipelinePayload } from '../utils/validation.js';
import { AppError } from '../utils/AppError.js';

const isValidObjectId = id => mongoose.Types.ObjectId.isValid(id);
const isDuplicateNameError = error => error?.code === 11000;

export function pipelineRouter() {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try { res.json({ pipelines: await Pipeline.find({ owner: req.user.sub }).sort({ updatedAt: -1 }) }); }
    catch (error) { next(error); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      if (!isValidObjectId(req.params.id)) throw new AppError('Invalid pipeline id.', 400, 'INVALID_PIPELINE_ID');
      const pipeline = await Pipeline.findOne({ _id: req.params.id, owner: req.user.sub });
      if (!pipeline) throw new AppError('Pipeline not found.', 404, 'PIPELINE_NOT_FOUND');
      res.json({ pipeline });
    } catch (error) { next(error); }
  });

  router.post('/', async (req, res, next) => {
    try {
      const payload = validatePipelinePayload(req.body);
      const pipeline = await Pipeline.create({ ...payload, owner: req.user.sub });
      res.status(201).json({ pipeline });
    } catch (error) {
      if (isDuplicateNameError(error)) return next(new AppError('You already have a pipeline with this name.', 409, 'DUPLICATE_PIPELINE_NAME'));
      next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      if (!isValidObjectId(req.params.id)) throw new AppError('Invalid pipeline id.', 400, 'INVALID_PIPELINE_ID');
      const payload = validatePipelinePayload(req.body);
      const pipeline = await Pipeline.findOneAndUpdate({ _id: req.params.id, owner: req.user.sub }, payload, { new: true, runValidators: true });
      if (!pipeline) throw new AppError('Pipeline not found.', 404, 'PIPELINE_NOT_FOUND');
      res.json({ pipeline });
    } catch (error) {
      if (isDuplicateNameError(error)) return next(new AppError('You already have a pipeline with this name.', 409, 'DUPLICATE_PIPELINE_NAME'));
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      if (!isValidObjectId(req.params.id)) throw new AppError('Invalid pipeline id.', 400, 'INVALID_PIPELINE_ID');
      const pipeline = await Pipeline.findOneAndDelete({ _id: req.params.id, owner: req.user.sub });
      if (!pipeline) throw new AppError('Pipeline not found.', 404, 'PIPELINE_NOT_FOUND');
      res.status(204).send();
    } catch (error) { next(error); }
  });

  return router;
}
