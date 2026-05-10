require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  try {
    const file = path.join(__dirname, process.env.DATABASES_FILE || 'databases.json');
    if (!fs.existsSync(file)) {
      console.error('databases.json not found at', file);
      process.exit(2);
    }

    const dbs = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(dbs) || dbs.length === 0) {
      console.error('No database entries in databases.json');
      process.exit(2);
    }

    const db = dbs[0];
    console.log('Testing connection for entry:', db.name || db.id, 'type:', db.type);

    if ((db.type || '').toLowerCase() === 'mysql') {
      const conn = await mysql.createConnection({
        host: db.host || '127.0.0.1',
        port: db.port || 3306,
        user: db.user || db.username || 'root',
        password: db.password || '',
        database: db.database || undefined
      });
      try {
        await conn.query('SELECT 1');
        console.log('MySQL connection successful');
      } finally {
        await conn.end();
      }
      process.exit(0);
    }

    if ((db.type || '').toLowerCase().startsWith('mongo')) {
      const mongoose = require('mongoose');
      const uri = db.uri || (`mongodb://${db.host || '127.0.0.1'}:${db.port || 27017}/${db.database || 'test'}`);
      const m = await mongoose.createConnection(uri).asPromise();
      await m.close();
      console.log('MongoDB connection successful');
      process.exit(0);
    }

    console.error('Unsupported DB type for this quick test:', db.type);
    process.exit(2);
  } catch (e) {
    console.error('Connection test failed:', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
