import mongoose from 'mongoose';
import { DEFAULT_BATCH_SIZE, MAX_BATCH_SIZE } from '../config/constants.js';

const mappingSchema = new mongoose.Schema({
  source: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  transform: { type: String, trim: true, default: '' },
  required: { type: Boolean, default: false },
  validation: { type: String, trim: true, default: '' }
}, { _id: false });

const pipelineSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  mappings: { type: [mappingSchema], required: true, validate: { validator: value => Array.isArray(value) && value.length > 0, message: 'A pipeline needs at least one column mapping.' } },
  source: { type: { type: String, enum: ['csv-upload'], default: 'csv-upload' } },
  destination: { type: { type: String, enum: ['mongodb'], default: 'mongodb' }, collectionPrefix: { type: String, default: 'etl_' } },
  batchSize: { type: Number, default: DEFAULT_BATCH_SIZE, min: 1, max: MAX_BATCH_SIZE }
}, { timestamps: true });

pipelineSchema.index({ owner: 1, name: 1 }, { unique: true });
export const Pipeline = mongoose.models.Pipeline || mongoose.model('Pipeline', pipelineSchema);
