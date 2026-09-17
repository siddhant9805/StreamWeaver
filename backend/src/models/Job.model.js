const mongoose = require('mongoose');

/**
 * A single mapping rule: which source CSV column maps to which
 * destination field, plus an optional user-authored JS transform
 * (executed inside the isolated-vm sandbox, e.g. "return value.toUpperCase()")
 */
const MappingRuleSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },       // CSV header name
    destination: { type: String, required: true },  // target field name in MongoDB
    transformCode: { type: String, default: null },  // optional user JS, sandbox-executed
  },
  { _id: false }
);

/**
 * A single validation rule applied to the mapped (destination) field
 * before a row is allowed into the bulk insert buffer.
 */
const ValidationRuleSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    required: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'date', 'any'],
      default: 'any',
    },
  },
  { _id: false }
);

const JobSchema = new mongoose.Schema(
  {
    originalFileName: { type: String, required: true },
    tempFilePath: { type: String, required: true }, // where the raw upload was streamed to on disk
    targetCollection: { type: String, required: true }, // dynamic MongoDB collection for the cleaned output

    status: {
      type: String,
      enum: ['uploaded', 'mapped', 'processing', 'completed', 'failed'],
      default: 'uploaded',
      index: true,
    },

    headers: { type: [String], default: [] },
    sampleRows: { type: [mongoose.Schema.Types.Mixed], default: [] }, // first N rows for the mapping UI preview

    mapping: { type: [MappingRuleSchema], default: [] },
    validation: { type: [ValidationRuleSchema], default: [] },

    totalRowsEstimate: { type: Number, default: 0 },
    processedRows: { type: Number, default: 0 },
    insertedRows: { type: Number, default: 0 },
    failedRows: { type: Number, default: 0 },
    rowsPerSecond: { type: Number, default: 0 },

    errorMessage: { type: String, default: null },

    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', JobSchema);
