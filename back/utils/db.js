const knex = require('knex');
const mongoose = require('mongoose');

const DB_CLIENT = process.env.DB_CLIENT || process.env.DB_TYPE || 'mysql';

let sql = null;
let mongo = null;

async function init() {
  if (DB_CLIENT === 'mongo' || DB_CLIENT === 'mongodb') {
    const mongoUri = process.env.MONGO_URI || buildMongoUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    mongo = mongoose;
    return { mongo };
  }

  // SQL (mysql, pg, sqlite3)
  const client = process.env.DB_CLIENT || 'mysql';
  const connection = getSqlConnection(client);

  sql = knex({
    client,
    connection,
    pool: { min: 0, max: 7 }
  });

  // verify connection for SQL clients
  try {
    if (client === 'sqlite3') {
      await sql.raw('select 1');
    } else {
      await sql.raw('SELECT 1');
    }
  } catch (err) {
    console.warn('SQL connection verification failed:', err.message || err);
  }

  return { sql };
}

function buildMongoUri() {
  const host = process.env.MONGO_HOST || 'localhost';
  const port = process.env.MONGO_PORT || '27017';
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  const db = process.env.MONGO_DB || 'test';

  if (user && pass) {
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
  }
  return `mongodb://${host}:${port}/${db}`;
}

function getSqlConnection(client) {
  if (client === 'sqlite3') {
    return {
      filename: process.env.SQLITE_FILENAME || './data/sqlite.db'
    };
  }

  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || (client === 'mysql' ? 3306 : 5432),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'app_db'
  };
}

module.exports = {
  init,
  get sql() { return sql; },
  get mongoose() { return mongo; }
};
