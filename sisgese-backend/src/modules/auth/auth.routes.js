'use strict';
const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { z } = require('zod');
const authService = require('./auth.service');
const { registrarAuditoria } = require('../../shared/auditoria');
const { normalizeIdentity } = require('../../shared/identity');

const router = express.Router();

const loginSchema = z.object({
  identity: z.string().trim().min(1, 'Informe a identificação.').max(100),
  password: z.string().min(1, 'Informe a senha.').max(200),
  area: z.enum(['management', 'gate'])
});

const tooMany = { message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' };

// Só tentativas que falham contam (skipSuccessfulRequests).
const limitByIp = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  skipSuccessfulRequests: true, message: tooMany
});
const limitByIdentity = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false,
  skipSuccessfulRequests: true, message: tooMany,
  keyGenerator: (req) => ipKeyGenerator(req.ip) + '|' + normalizeIdentity(req.body && req.body.identity)
});

const regenerate = (req) => new Promise((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : resolve())));
const destroy = (req) => new Promise((resolve) => req.session.destroy(() => resolve()));

router.get('/me', (req, res) => {
  const id = req.session && req.session.userId;
  const user = id ? authService.getActiveUserById(id) : null;
  res.json(user ? authService.toPublicUser(user) : null);
});

router.post('/login', limitByIp, limitByIdentity, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await authService.login(data);
    await regenerate(req); // nova sessão a cada login (evita fixação de sessão)
    req.session.userId = user.id;
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const id = req.session && req.session.userId;
    const user = id ? authService.getActiveUserById(id) : null;
    if (user) registrarAuditoria('Logout', null, '', user.name);
    await destroy(req);
    res.clearCookie('sisgece.sid');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
