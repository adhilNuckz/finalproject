require('dotenv').config();
const db = require('./utils/db');

async function main() {
  try {
    console.log('Starting DB init with env DB_CLIENT=', process.env.DB_CLIENT || process.env.DB_TYPE || 'mysql');
    const res = await db.init();
    if (res.sql) {
      console.log('SQL client initialized. Running simple test query...');
      try {
        const out = await res.sql.raw(process.env.DB_CLIENT === 'sqlite3' ? 'select 1' : 'SELECT 1');
        console.log('SQL test query result:', Array.isArray(out) ? out[0] : out);
      } catch (e) {
        console.error('SQL test query failed:', e.message || e);
      }
    }

    if (res.mongo) {
      console.log('Mongo client (mongoose) initialized. Connection readyState:', res.mongo.connection && res.mongo.connection.readyState);
    }

    console.log('DB init finished.');
  } catch (e) {
    console.error('DB init error:', e && e.message ? e.message : e);
    process.exit(1);
  }

  process.exit(0);
}

main();
