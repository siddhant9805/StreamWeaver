const mongoose = require('mongoose');

/**
 * PipelineConfig
 * ---------------
 * Week 2 database deliverable (Nikhil Singh — Database & Testing).
 *
 * A *saved, reusable* pipeline definition built in the Pipeline Builder UI
 * (Akiti's Week 2/3 work): a Source, an ordered list of Transformation
 * steps, and a Destination. Saving this is what Siddhi's
 * "Create API to save pipeline configuration" endpoint persists, and
 * loading it is what "Create API to load pipeline configuration" reads.
 *
 * This is intentionally separate from `Job` (src/models/Job.model.js):
 * `Job` is the Week 1 "upload one CSV, process it once" record. A
 * `PipelineConfig` is a *reusable template* that can be run many times —
 * each execution becomes a `PipelineRun` (see PipelineRun.model.js,
 * Week 3), not a new `Job`.
 */

const SourceConfigSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['csv_upload', 'database', 'api'],
      required: true,
      default: 'csv_upload',
    },
    // Free-form settings for whichever `type` is chosen, e.g. for
    // csv_upload: { fileName, headers }; for database: { connectionRef, table }.
    // Kept as Mixed because Source options differ per type and are still
    // being defined by the frontend/backend team in Week 2.
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const TransformationStepSchema = new mongoose.Schema(
  {
    // e.g. 'map', 'filter', 'aggregate' — 'filter'/'aggregate' land in Week 3
    // per Siddhant's "Add second transformation type" task.
    type: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    params: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const DestinationConfigSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['mongodb_collection', 'file_export'],
      required: true,
      default: 'mongodb_collection',
    },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const PipelineConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
      index: true,
    },

    source: { type: SourceConfigSchema, required: true },
    transformations: { type: [TransformationStepSchema], default: [] },
    destination: { type: DestinationConfigSchema, required: true },

    // Denormalized convenience counter — avoids a $lookup just to show
    // "last run" / "N runs" in the Pipeline Builder list view. Kept in
    // sync by the Run API (see docs/DATABASE_SCHEMA.md, "Sync responsibility").
    lastRunAt: { type: Date, default: null },
    lastRunStatus: {
      type: String,
      enum: ['never_run', 'running', 'success', 'failed'],
      default: 'never_run',
    },
    totalRuns: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PipelineConfig', PipelineConfigSchema);
