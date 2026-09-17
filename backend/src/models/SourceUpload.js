import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  originalName: { type: String, required: true, maxlength: 255 },
  status: { type: String, enum: ['UPLOADED'], default: 'UPLOADED' }
}, { timestamps: true });

export const SourceUpload = mongoose.models.SourceUpload || mongoose.model('SourceUpload', schema);
