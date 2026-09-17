const mongoose = require('mongoose');

const FailedRowSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    rowNumber: { type: Number, required: true },
    rawData: { type: mongoose.Schema.Types.Mixed, required: true },
    reason: { type: String, required: true },
  },
  { timestamps: true }
);

FailedRowSchema.index({ job: 1, rowNumber: 1 });

module.exports = mongoose.model('FailedRow', FailedRowSchema);
