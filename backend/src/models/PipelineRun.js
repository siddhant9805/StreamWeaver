import mongoose from 'mongoose';
import { PIPELINE_RUN_STATUS } from '../config/constants.js';

const stepSchema = new mongoose.Schema({
  name: { type: String, required: true }, type: { type: String, required: true },
  status: { type: String, enum: Object.values(PIPELINE_RUN_STATUS), required: true },
  startedAt: Date, completedAt: Date, processedRows: { type: Number, default: 0 }, insertedRows: { type: Number, default: 0 }, error: { type: String, default: null }
}, { _id: false });

const failedRowSchema = new mongoose.Schema({
  rowNumber: { type: Number, required: true },
  error: { type: String, required: true },
  source: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const schema = new mongoose.Schema({
  pipeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Pipeline', required: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sourceJobId: { type: String, required: true, trim: true },
  destinationCollection: { type: String, required: true },
  status: { type: String, enum: Object.values(PIPELINE_RUN_STATUS), required: true, index: true },
  startedAt: { type: Date, required: true }, completedAt: Date,
  processedRows: { type: Number, default: 0 }, insertedRows: { type: Number, default: 0 },
  failedRowCount: { type: Number, default: 0 },
  failedRows: { type: [failedRowSchema], default: [] },
  error: { code: { type: String, default: null }, message: { type: String, default: null } },
  steps: { type: [stepSchema], default: [] }
}, { timestamps: true });

export const PipelineRun = mongoose.models.PipelineRun || mongoose.model('PipelineRun', schema);
