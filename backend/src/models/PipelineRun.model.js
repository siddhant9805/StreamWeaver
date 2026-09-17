const mongoose = require('mongoose');

/**
 * PipelineRun (a.k.a. "Run History")
 * ------------------------------------
 * Week 3 database deliverable (Nikhil Singh — Database & Testing).
 *
 * One document per execution of a PipelineConfig, created when Siddhi's
 * "Pipeline Run API" is triggered (Akiti's "Run Pipeline" button) and
 * updated as the run progresses through Source -> Transformation ->
 * Destination (Siddhant's Week 3 integration work).
 *
 * Relationship: PipelineConfig 1 --- * PipelineRun (one config, many runs
 * over time — that history is the point of this collection).
 */

const RunLogEntrySchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
    message: { type: String, required: true },
    // Which step emitted this log line, if applicable — lets the Run
    // History page (Akiti, Week 3) group log lines under a step.
    step: { type: String, default: null }, // 'source' | 'transformation' | 'destination' | null
  },
  { _id: false }
);

const PipelineRunSchema = new mongoose.Schema(
  {
    pipeline: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PipelineConfig',
      required: true,
      index: true,
    },

    // Matches Siddhi's Week 3 task: "Add run status codes (Running,
    // Success, Failed) in backend".
    status: {
      type: String,
      enum: ['running', 'success', 'failed'],
      default: 'running',
      index: true,
    },

    rowsProcessed: { type: Number, default: 0 },
    rowsSucceeded: { type: Number, default: 0 },
    rowsFailed: { type: Number, default: 0 },

    // Matches Siddhi's "Implement error handling and failure response
    // format for Run API" — a structured error, not just a string, so the
    // frontend's error component (Akiti, Week 3) can show step + reason.
    error: {
      step: { type: String, default: null }, // which step failed
      message: { type: String, default: null },
    },

    // Matches Siddhi's "Add backend logging for each pipeline execution
    // step" — the log lines live here so Run History can show them per run.
    logs: { type: [RunLogEntrySchema], default: [] },

    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Run History is always viewed scoped to a pipeline, newest first —
// this compound index is what makes that query and its pagination fast.
PipelineRunSchema.index({ pipeline: 1, startedAt: -1 });

module.exports = mongoose.model('PipelineRun', PipelineRunSchema);
