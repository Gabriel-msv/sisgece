'use strict';
require('dotenv').config();
const path = require('path');

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  sessionSecret: process.env.SESSION_SECRET,
  dbPath: path.resolve(process.env.DB_PATH || './data/sisgece.db'),
  admin: {
    name: process.env.ADMIN_NAME || 'Superusuario',
    identity: process.env.ADMIN_IDENTITY,
    password: process.env.ADMIN_PASSWORD
  }
};

if (!env.sessionSecret || env.sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET ausente ou curto demais (mínimo 32 caracteres) no .env');
}

module.exports = env;
