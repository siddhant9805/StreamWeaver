import { DEFAULT_BATCH_SIZE, MAX_BATCH_SIZE, MAX_MAPPINGS } from '../config/constants.js';
import { AppError } from './AppError.js';

export function validatePipelinePayload(payload = {}) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!name) throw new AppError('Pipeline name is required.', 400, 'VALIDATION_ERROR');
  if (!Array.isArray(payload.mappings) || !payload.mappings.length) throw new AppError('Mappings must be a non-empty array.', 400, 'VALIDATION_ERROR');
  if (payload.mappings.length > MAX_MAPPINGS) throw new AppError(`Mappings cannot exceed ${MAX_MAPPINGS} entries.`, 400, 'VALIDATION_ERROR');
  const mappings = payload.mappings.map((m, i) => {
    const source = typeof m?.source === 'string' ? m.source.trim() : '';
    const destination = typeof m?.destination === 'string' ? m.destination.trim() : '';
    if (!source) throw new AppError(`Mapping ${i + 1}: source is required.`, 400, 'VALIDATION_ERROR');
    if (!destination) throw new AppError(`Mapping ${i + 1}: destination is required.`, 400, 'VALIDATION_ERROR');
    if (m.transform !== undefined && typeof m.transform !== 'string') throw new AppError(`Mapping ${i + 1}: transform must be a string.`, 400, 'VALIDATION_ERROR');
    return { source, destination, transform: m.transform?.trim() || '', required: Boolean(m.required), validation: typeof m.validation === 'string' ? m.validation.trim() : '' };
  });
  const batchSize = payload.batchSize ?? DEFAULT_BATCH_SIZE;
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > MAX_BATCH_SIZE) throw new AppError(`batchSize must be an integer between 1 and ${MAX_BATCH_SIZE}.`, 400, 'VALIDATION_ERROR');
  const source = { type: payload.source?.type || 'csv-upload' };
  const destination = { type: payload.destination?.type || 'mongodb', collectionPrefix: payload.destination?.collectionPrefix || 'etl_' };
  if (source.type !== 'csv-upload') throw new AppError('Only csv-upload sources are supported by the current executor.', 400, 'UNSUPPORTED_SOURCE');
  if (destination.type !== 'mongodb') throw new AppError('Only mongodb destinations are supported by the current executor.', 400, 'UNSUPPORTED_DESTINATION');
  return { name, description: typeof payload.description === 'string' ? payload.description.trim() : '', mappings, batchSize, source, destination };
}

export function validateRunPayload(payload = {}) {
  const sourceJobId = typeof payload.sourceJobId === 'string' ? payload.sourceJobId.trim() : '';
  if (!sourceJobId) throw new AppError('sourceJobId is required to run a pipeline.', 400, 'VALIDATION_ERROR');
  if (!/^[0-9a-f-]{36}$/i.test(sourceJobId)) throw new AppError('sourceJobId must be a valid upload job id.', 400, 'VALIDATION_ERROR');
  return { sourceJobId };
}
