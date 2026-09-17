import { Transform, Writable, pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { parse } from 'csv-parse';
import { transformValue } from './sandbox.js';
const pipe = promisify(pipeline);
const MAX_STORED_FAILED_ROWS = 500;

const safeRowSnapshot = row => Object.fromEntries(Object.entries(row || {}).slice(0, 25).map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 500) : value]));

class RowMapper extends Transform {
  constructor({ mappings, onProgress, maxRows = 500000 }) {
    super({ objectMode: true, highWaterMark: 256 });
    this.mappings = mappings;
    this.onProgress = onProgress;
    this.maxRows = maxRows;
    this.processed = 0;
    this.failed = 0;
    this.failedRows = [];
    this.rowNumber = 1;
  }
  async _transform(row, _, done) {
    const currentRow = this.rowNumber++;
    try {
      if (this.processed + this.failed >= this.maxRows) return done(new Error(`Pipeline row limit of ${this.maxRows} was exceeded.`));
      const result = {};
      for (const mapping of this.mappings) {
        const value = row[mapping.source];
        if (mapping.required && (value === undefined || value === null || String(value).trim() === '')) {
          throw new Error(`Required field '${mapping.source}' is empty.`);
        }
        if (mapping.validation) {
          const rule = String(mapping.validation).trim();
          if (rule.startsWith('/') && rule.lastIndexOf('/') > 0) {
            const last = rule.lastIndexOf('/');
            const regex = new RegExp(rule.slice(1, last), rule.slice(last + 1));
            if (!regex.test(String(value ?? ''))) throw new Error(`Validation failed for '${mapping.source}'.`);
          }
        }
        result[mapping.destination] = await transformValue(mapping.transform, value, row);
      }
      this.processed += 1;
      if (this.processed % 100 === 0) this.onProgress?.({ processed: this.processed, failed: this.failed });
      done(null, result);
    } catch (error) {
      this.failed += 1;
      const failure = { rowNumber: currentRow, error: error.message || String(error), source: safeRowSnapshot(row) };
      if (this.failedRows.length < MAX_STORED_FAILED_ROWS) this.failedRows.push(failure);
      this.onProgress?.({ processed: this.processed, failed: this.failed, failedRow: failure });
      done();
    }
  }
}

class BulkWriter extends Writable {
  constructor({ collection, batchSize, onProgress }) { super({ objectMode: true, highWaterMark: 256 }); this.collection = collection; this.batchSize = batchSize; this.onProgress = onProgress; this.batch = []; this.inserted = 0; }
  async _write(row, _, done) { try { this.batch.push(row); if (this.batch.length >= this.batchSize) await this.flush(); done(); } catch (error) { done(error); } }
  async _final(done) { try { await this.flush(); done(); } catch (error) { done(error); } }
  async flush() { if (!this.batch.length) return; const batch = this.batch; this.batch = []; const result = await this.collection.bulkWrite(batch.map(document => ({ insertOne: { document } })), { ordered: false }); this.inserted += result.insertedCount ?? batch.length; this.onProgress?.({ inserted: this.inserted }); }
}

export async function processCsv({ source, collection, mappings, onProgress, batchSize = 5000, maxRows = 500000 }) {
  let bytesRead = 0;
  const totalBytes = Number(source.totalBytes || 0);
  source.on?.('data', chunk => { bytesRead += chunk.length; if (totalBytes) onProgress?.({ bytesRead, totalBytes, percent: Math.min(99, Math.round((bytesRead / totalBytes) * 100)) }); });
  const mapper = new RowMapper({ mappings, onProgress, maxRows });
  const writer = new BulkWriter({ collection, batchSize, onProgress });
  await pipe(source, parse({ columns: true, bom: true, skip_empty_lines: true, trim: true }), mapper, writer);
  return { processed: mapper.processed, inserted: writer.inserted, failed: mapper.failed, failedRows: mapper.failedRows };
}
