import fs from 'node:fs';
import path from 'node:path';

export function createLogger({ logDir = 'logs' } = {}) {
  const dir = path.resolve(logDir);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'pipeline-runs.log');
  const write = (level, event, context = {}) => {
    const entry = { timestamp: new Date().toISOString(), level, event, ...context };
    fs.appendFileSync(file, `${JSON.stringify(entry)}\n`, 'utf8');
    return entry;
  };
  return { info: (e, c) => write('INFO', e, c), warn: (e, c) => write('WARN', e, c), error: (e, c) => write('ERROR', e, c) };
}
