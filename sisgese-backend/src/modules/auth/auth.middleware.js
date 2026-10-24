'use strict';
const AppError = require('../../shared/AppError');
const { toPublicUser, getActiveUserById } = require('./auth.service');

// A cada requisição o usuário é relido do banco: se foi desativado, perde o acesso na hora.
function requireAuth(req, res, next) {
  const id = req.session && req.session.userId;
  const user = id ? getActiveUserById(id) : null;
  if (!user) return next(new AppError('Faça login para continuar.', 401));
  req.user = toPublicUser(user);
  next();
}

function requireRole(...roles) {
  return [
    requireAuth,
    (req, res, next) => (roles.includes(req.user.role) ? next() : next(new AppError('Acesso negado.', 403)))
  ];
}

module.exports = { requireAuth, requireRole };
