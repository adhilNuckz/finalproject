require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  try {
    const mongoUri = process.env.MONGO_URI || buildMongoUri();
    console.log('Testing MongoDB connection...');
    console.log('URI:', mongoUri.replace(/:[^@]*@/, ':****@')); // mask password

    const conn = await mongoose.createConnection(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }).asPromise();

    console.log('MongoDB connection successful');
    console.log('Connection state:', conn.readyState);

    await conn.close();
    process.exit(0);
  } catch (e) {
    console.error('MongoDB connection failed:', e && e.message ? e.message : e);
    process.exit(1);
  }
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

main();
