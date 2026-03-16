const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const { runExec } = require('../utils/exec');

const DATABASES_FILE = path.join(__dirname, '..', 'databases.json');

// ==================== Helpers ====================

function readDatabases() {
  try {
    if (!fs.existsSync(DATABASES_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATABASES_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeDatabases(dbs) {
  fs.writeFileSync(DATABASES_FILE, JSON.stringify(dbs, null, 2));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

async function testConnection(db) {
  const type = (db.type || '').toLowerCase();

  if (type === 'mysql') {
    const connection = await mysql.createConnection({
      host: db.host || '127.0.0.1',
      port: db.port || 3306,
      user: db.user || db.username,
      password: db.password || '',
      database: db.database || undefined
    });
    try {
      await connection.query('SELECT 1');
    } finally {
      await connection.end();
    }
    return;
  }

  if (type === 'mongo' || type === 'mongodb') {
    const uri = db.uri || buildMongoUri(db);
    const conn = await mongoose.createConnection(uri).asPromise();
    await conn.close();
    return;
  }

  throw new Error('Test connection not implemented for this database type');
}

function buildMongoUri(db) {
  const host = db.host || '127.0.0.1';
  const port = db.port || 27017;
  const database = db.database || 'test';
  const user = db.user || db.username;
  const pass = db.password;

  if (user && pass) {
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${database}`;
  }
  return `mongodb://${host}:${port}/${database}`;
}

async function getMysqlAdminConnection() {
  const adminUser = process.env.MYSQL_ADMIN_USER;
  const adminPassword = process.env.MYSQL_ADMIN_PASSWORD || '';
  const host = process.env.MYSQL_ADMIN_HOST || '127.0.0.1';
  const port = process.env.MYSQL_ADMIN_PORT ? Number(process.env.MYSQL_ADMIN_PORT) : 3306;

  if (!adminUser) {
    throw new Error('MYSQL_ADMIN_USER not configured on server');
  }

  return mysql.createConnection({
    host,
    port,
    user: adminUser,
    password: adminPassword
  });
}

function checkCommand(cmd) {
  return new Promise((resolve) => {
    exec(`command -v ${cmd} >/dev/null 2>&1`, (err) => {
      resolve(!err);
    });
  });
}

function checkServiceActive(service) {
  return new Promise((resolve) => {
    exec(`systemctl is-active --quiet ${service}`, (err) => {
      resolve(!err);
    });
  });
}

// ==================== Routes ====================

// GET all database connections
router.get('/', (req, res) => {
  try {
    const dbs = readDatabases();
    res.json({ success: true, databases: dbs });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET system database tools / services status
router.get('/status', async (req, res) => {
  try {
    const [
      mysqlInstalled,
      mysqlActive,
      mongoInstalled,
      mongoActive,
      pgInstalled,
      pgActive,
      sqliteInstalled
    ] = await Promise.all([
      checkCommand('mysql'),
      checkServiceActive('mysql').catch(() => false),
      checkCommand('mongod'),
      checkServiceActive('mongod').catch(() => false),
      checkCommand('psql'),
      checkServiceActive('postgresql').catch(() => false),
      checkCommand('sqlite3')
    ]);

    const phpMyAdminInstalled = fs.existsSync('/usr/share/phpmyadmin') || fs.existsSync('/etc/phpmyadmin');

    let phpMyAdminUrl = null;
    if (phpMyAdminInstalled && req.headers.host) {
      const host = req.headers.host.split(':')[0];
      phpMyAdminUrl = `http://${host}/phpmyadmin`;
    }

    res.json({
      success: true,
      status: {
        mysql: { installed: mysqlInstalled, active: mysqlActive },
        mongo: { installed: mongoInstalled, active: mongoActive },
        postgres: { installed: pgInstalled, active: pgActive },
        sqlite: { installed: sqliteInstalled },
        phpmyadmin: { installed: phpMyAdminInstalled, url: phpMyAdminUrl }
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST create a new database connection config
router.post('/', (req, res) => {
  const { name, type, host, port, user, password, database, uri } = req.body;

  if (!name || !type) {
    return res.status(400).json({ success: false, error: 'Name and type are required' });
  }

  const dbs = readDatabases();

  if (dbs.find(d => d.name === name)) {
    return res.status(400).json({ success: false, error: 'Database config with this name already exists' });
  }

  const db = {
    id: generateId(),
    name,
    type,
    host: host || '',
    port: port || null,
    user: user || '',
    password: password || '',
    database: database || '',
    uri: uri || '',
    createdAt: new Date().toISOString()
  };

  dbs.push(db);
  writeDatabases(dbs);

  res.json({ success: true, database: db });
});

// POST install a database server / tool (apt-based systems)
router.post('/install', (req, res) => {
  const { type } = req.body || {};
  if (!type) {
    return res.status(400).json({ success: false, error: 'type is required' });
  }

  const t = String(type).toLowerCase();
  let cmd = '';

  const isRoot = typeof process.getuid === 'function' && process.getuid() === 0;
  const sudoPrefix = isRoot ? '' : 'sudo ';

  if (t === 'mysql') {
    cmd = `${sudoPrefix}apt-get update && ${sudoPrefix}apt-get install -y mysql-server`;
  } else if (t === 'mongo' || t === 'mongodb') {
    cmd = `${sudoPrefix}apt-get update && ${sudoPrefix}apt-get install -y mongodb`;
  } else if (t === 'postgres' || t === 'postgresql' || t === 'pg') {
    cmd = `${sudoPrefix}apt-get update && ${sudoPrefix}apt-get install -y postgresql`;
  } else if (t === 'phpmyadmin') {
    cmd = `${sudoPrefix}apt-get update && ${sudoPrefix}apt-get install -y phpmyadmin`;
  } else {
    return res.status(400).json({ success: false, error: 'Unsupported install type' });
  }

  runExec(cmd, res);
});

// POST create a MySQL user (optional helper when adding a connection)
// Requires MYSQL_ADMIN_USER (+ optional MYSQL_ADMIN_PASSWORD) to be set on the server.
router.post('/mysql/create-user', async (req, res) => {
  const { username, password, host } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'username and password are required' });
  }

  const userHost = host || 'localhost';

  if (!/^[A-Za-z0-9_]+$/.test(username)) {
    return res.status(400).json({ success: false, error: 'Invalid username format' });
  }

  if (!/^[A-Za-z0-9_.%-]+$/.test(userHost)) {
    return res.status(400).json({ success: false, error: 'Invalid host format' });
  }

  let conn;
  try {
    conn = await getMysqlAdminConnection();

    // Create user (if not exists) and grant full access; user can manage DBs via phpMyAdmin
    await conn.query(`CREATE USER IF NOT EXISTS '${username}'@'${userHost}' IDENTIFIED BY ?`, [password]);
    await conn.query(`GRANT ALL PRIVILEGES ON *.* TO '${username}'@'${userHost}'`);
    await conn.query('FLUSH PRIVILEGES');

    res.json({ success: true, message: `MySQL user ${username}@${userHost} created/updated` });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message || 'Failed to create MySQL user' });
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch {
        // ignore
      }
    }
  }
});

// PUT update an existing database config
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};

  const dbs = readDatabases();
  const index = dbs.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Database config not found' });
  }

  const current = dbs[index];
  const updated = {
    ...current,
    name: updates.name !== undefined ? updates.name : current.name,
    type: updates.type !== undefined ? updates.type : current.type,
    host: updates.host !== undefined ? updates.host : current.host,
    port: updates.port !== undefined ? updates.port : current.port,
    user: updates.user !== undefined ? updates.user : current.user,
    password: updates.password !== undefined && updates.password !== '' ? updates.password : current.password,
    database: updates.database !== undefined ? updates.database : current.database,
    uri: updates.uri !== undefined ? updates.uri : current.uri,
    updatedAt: new Date().toISOString()
  };

  dbs[index] = updated;
  writeDatabases(dbs);

  res.json({ success: true, database: updated });
});

// DELETE a database config
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const dbs = readDatabases();
  const index = dbs.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Database config not found' });
  }

  const removed = dbs.splice(index, 1)[0];
  writeDatabases(dbs);

  res.json({ success: true, database: removed });
});

// POST test connection for a database config by id
router.post('/:id/test', async (req, res) => {
  const { id } = req.params;
  const dbs = readDatabases();
  const db = dbs.find(d => d.id === id);

  if (!db) {
    return res.status(404).json({ success: false, error: 'Database config not found' });
  }

  try {
    await testConnection(db);
    res.json({ success: true, message: 'Connection successful' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message || 'Connection failed' });
  }
});

module.exports = router;
