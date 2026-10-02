import fs from 'node:fs/promises';
import path from 'node:path';

const distDirectory = path.resolve('dist');
await fs.mkdir(distDirectory, { recursive: true });
await fs.writeFile(
  path.join(distDirectory, 'package.json'),
  JSON.stringify({ type: 'commonjs' }) + '\n',
  'utf8'
);
