import app from './app';
import { env } from './config/env';
import cron from 'node-cron';
import { cleanupTemporaryDocuments } from './services/document';

app.listen(env.port, () => {
  console.log(`Hope-Care API listening on port ${env.port}`);
});

cron.schedule('*/10 * * * *', () => {
  cleanupTemporaryDocuments().catch((error) => console.error('Temporary document cleanup failed', error));
});
