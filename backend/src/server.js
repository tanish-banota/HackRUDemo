import 'dotenv/config';
import app from './app.js';
import { initializeDatabase } from './db.js';

const port = Number(process.env.PORT || 4000);

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Time Until API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Unable to initialize database', error);
    process.exitCode = 1;
  });
