import { parse } from 'csv-parse';
import { Router } from 'express';
import Busboy from 'busboy';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { processCsv } from '../services/etlPipeline.js';
import { AppError } from '../utils/AppError.js';
import { SourceUpload } from '../models/SourceUpload.js';
export function etlRouter({ uploadDir, io, logger }) {
  const router = Router();

  router.get('/uploads', async (req, res, next) => {
    try {
      const uploads = await SourceUpload.find({ owner: req.user.sub })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
      res.json({ success: true, uploads });
    } catch (error) {
      next(error);
    }
  });

  router.get('/uploads/:jobId/preview', async (req, res, next) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 1000, 1), 1000);
      const upload = await SourceUpload.findOne({ jobId: req.params.jobId, owner: req.user.sub }).lean();
      if (!upload) throw new AppError('Upload not found.', 404, 'UPLOAD_NOT_FOUND');
      const root = path.resolve(uploadDir);
      const file = path.resolve(root, `${req.params.jobId}.csv`);
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) throw new AppError('Uploaded CSV file was not found.', 404, 'SOURCE_NOT_FOUND');
      const rows = [];
      await new Promise((resolve, reject) => {
        const parser = fs.createReadStream(file).pipe(parse({ columns: true, bom: true, skip_empty_lines: true, trim: true, to: limit + 1 }));
        parser.on('data', row => rows.push(row));
        parser.on('end', resolve);
        parser.on('error', reject);
      });
      const columns = rows.length ? Object.keys(rows[0]) : [];
      res.json({ success: true, jobId: req.params.jobId, originalName: upload.originalName, columns, rows, rowCount: rows.length, previewLimit: limit });
    } catch (error) { next(error); }
  });

  router.post('/upload', (req, res, next) => {
    const jobId = crypto.randomUUID(); const root = path.resolve(uploadDir); const target = path.resolve(root, `${jobId}.csv`); fs.mkdirSync(root, { recursive: true });
    const busboy = Busboy({ headers: req.headers, limits: { files: 1, fileSize: 10 * 1024 ** 3 } }); let received = false; let originalName = ''; let writePromise = Promise.resolve(); let tooLarge = false;
    busboy.on('file', (_, stream, info) => { if (info.mimeType !== 'text/csv' && !info.filename.toLowerCase().endsWith('.csv')) return stream.resume(); received = true; originalName = info.filename; const writer = fs.createWriteStream(target, { flags: 'wx' }); writePromise = new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); stream.on('error', reject); stream.on('limit', () => { tooLarge = true; writer.destroy(new AppError('CSV exceeds the 10 GB upload limit.', 413, 'UPLOAD_TOO_LARGE')); }); }); stream.pipe(writer); });
    busboy.on('finish', async () => { try { if (!received) return res.status(400).json({ success: false, error: { code: 'CSV_REQUIRED', message: 'A CSV file is required.' } }); await writePromise; if (tooLarge) throw new AppError('CSV exceeds the 10 GB upload limit.', 413, 'UPLOAD_TOO_LARGE'); await SourceUpload.create({ jobId, owner: req.user.sub, originalName }); logger?.info('source.upload.completed', { jobId, ownerId: req.user.sub }); res.status(202).json({ success: true, jobId, message: 'CSV upload completed.' }); } catch (error) { next(error); } }); busboy.on('error', next); req.pipe(busboy);
  });
  router.post('/:jobId/process', async (req, res, next) => { try { const root = path.resolve(uploadDir); const file = path.resolve(root, `${req.params.jobId}.csv`); if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) throw new AppError('Upload not found.', 404, 'UPLOAD_NOT_FOUND'); const mappings = Array.isArray(req.body.mappings) ? req.body.mappings : []; if (!mappings.length || mappings.some(m => !m.source || !m.destination)) throw new AppError('At least one valid column mapping is required.', 400, 'VALIDATION_ERROR'); const emit = data => io?.emit(`etl:${req.params.jobId}`, { jobId: req.params.jobId, ...data }); emit({ status: 'started' }); const collection = mongoose.connection.db.collection(`etl_${req.params.jobId.replaceAll('-', '')}`); const result = await processCsv({ source: fs.createReadStream(file), collection, mappings, onProgress: emit }); emit({ status: 'complete', ...result }); res.json({ success: true, jobId: req.params.jobId, ...result }); } catch (error) { next(error); } });
  return router;
}
