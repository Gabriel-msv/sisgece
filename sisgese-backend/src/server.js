'use strict';
const env = require('./config/env');
require('./config/database');
const app = require('./app');

const host = process.env.HOST || '127.0.0.1';

app.listen(env.port, host, () => {
  console.log('SISGECE rodando em http://localhost:' + env.port);
});
