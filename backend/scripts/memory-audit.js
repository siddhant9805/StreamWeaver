#!/usr/bin/env node
/**
 * StreamWeaver 2GB memory audit.
 * Runs the CSV Extract -> Transform -> Bulk-write path with a no-op MongoDB sink.
 * Usage: npm run audit:memory -- ./uploads/large-2gb.csv
 * Set MEMORY_LIMIT_MB=150 to change the acceptance threshold.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse';
import { processCsv } from '../src/services/etlPipeline.js';

const file = process.argv[2];
const LIMIT_MB = Number(process.env.MEMORY_LIMIT_MB || 150);
if (!file) { console.error('Usage: npm run audit:memory -- <path-to-csv>'); process.exit(1); }
const target = path.resolve(file);
if (!fs.existsSync(target)) { console.error(`File not found: ${target}`); process.exit(1); }

async function getHeaders() {
  return new Promise((resolve, reject) => {
    const rows=[];
    const parser=fs.createReadStream(target).pipe(parse({columns:true,bom:true,skip_empty_lines:true,to:1}));
    parser.on('data', row => rows.push(row)); parser.on('end',()=>resolve(rows[0]?Object.keys(rows[0]):[])); parser.on('error',reject);
  });
}

const headers = await getHeaders();
if (!headers.length) { console.error('No CSV headers found.'); process.exit(1); }
const stat=fs.statSync(target);
const mappings=headers.map(h=>({source:h,destination:h}));
let peakRss=process.memoryUsage().rss;
const start=Date.now();
const sampler=setInterval(()=>{const rss=process.memoryUsage().rss;if(rss>peakRss)peakRss=rss},100);
const collection={ bulkWrite: async operations => ({insertedCount:operations.length}) };
try {
  const source=fs.createReadStream(target,{highWaterMark:1024*1024});
  source.totalBytes=stat.size;
  const result=await processCsv({source,collection,mappings,batchSize:5000,maxRows:Number.MAX_SAFE_INTEGER,onProgress:p=>{if(p.processed&&p.processed%10000===0)console.log(`Processed ${(p.processed).toLocaleString()} | RSS ${(process.memoryUsage().rss/1048576).toFixed(2)} MB`)}});
  clearInterval(sampler);
  peakRss=Math.max(peakRss,process.memoryUsage().rss);
  const elapsed=(Date.now()-start)/1000;
  const peak=peakRss/1048576;
  console.log('\n=== StreamWeaver 2GB / Memory Audit ===');
  console.log(`File: ${target}`);
  console.log(`Size: ${(stat.size/1073741824).toFixed(3)} GB`);
  console.log(`Processed: ${result.processed.toLocaleString()}`);
  console.log(`Inserted (simulated bulkWrite): ${result.inserted.toLocaleString()}`);
  console.log(`Failed rows: ${result.failed.toLocaleString()}`);
  console.log(`Peak RSS: ${peak.toFixed(2)} MB`);
  console.log(`Limit: ${LIMIT_MB.toFixed(2)} MB`);
  console.log(`Elapsed: ${elapsed.toFixed(2)} s`);
  console.log(`RESULT: ${peak<=LIMIT_MB?'PASS':'FAIL'}`);
  process.exitCode=peak<=LIMIT_MB?0:2;
} catch(error) { clearInterval(sampler); console.error(error); process.exitCode=1; }
