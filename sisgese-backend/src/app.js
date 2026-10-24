'use strict';
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const env = require('./config/env');
const { notFound, errorHandler } = require('./shared/errorHandler');

const app = express();
const frontRoot = path.resolve(__dirname, '../..');
const isProd = env.nodeEnv === 'production';

app.disable('x-powered-by');
// O CSP já está definido no <meta> do index.html, por isso o do helmet fica desligado.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '50kb' }));

// Sessão em memória: serve para desenvolvimento (reiniciar o servidor desloga todos).
app.use(session({
  name: 'sisgece.sid',
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd,
    maxAge: 2 * 60 * 60 * 1000
  }
}));

/* ---------- API ---------- */
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api', require('./modules/solicitacoes/solicitacoes.routes'));
app.use('/api', require('./modules/gestao/gestao.routes'));
// As rotas dos próximos passos entram aqui.
app.use('/api', notFound);

/* ---------- Front-end ----------
   Só duas coisas são servidas: o index.html e a pasta src/ do front.
   Nunca servir a pasta do projeto inteira: o .env do backend ficaria exposto. */
app.get('/', (req, res) => res.sendFile(path.join(frontRoot, 'index.html')));
app.use('/src', express.static(path.join(frontRoot, 'src')));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
