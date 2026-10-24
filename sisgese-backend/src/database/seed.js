'use strict';
const argon2 = require('argon2');
const db = require('../config/database');
const env = require('../config/env');
const { normalizeIdentity } = require('../shared/identity');

async function seed() {
  const { name, identity, password } = env.admin;

  if (!identity || !password) {
    throw new Error('Defina ADMIN_IDENTITY e ADMIN_PASSWORD no .env');
  }
  if (password.length < 8 || password === 'troque-esta-senha') {
    throw new Error('Troque ADMIN_PASSWORD no .env por uma senha própria com 8+ caracteres');
  }

  const normalized = normalizeIdentity(identity);
  const exists = db.prepare('SELECT id FROM usuarios WHERE id = ? OR identity = ?').get('root', normalized);
  if (exists) {
    console.log('Superusuário já existe. Nada a fazer.');
    return;
  }

  const hash = await argon2.hash(password);
  db.prepare(
    `INSERT INTO usuarios (id, name, identity, password_hash, role, active, created_at)
     VALUES (?, ?, ?, ?, 'superuser', 1, ?)`
  ).run('root', name, normalized, hash, new Date().toISOString());

  console.log('Superusuário criado: ' + normalized);
}

seed().catch((err) => {
  console.error('Erro no seed:', err.message);
  process.exit(1);
});
