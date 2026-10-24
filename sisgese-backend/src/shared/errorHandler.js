'use strict';
const { ZodError } = require('zod');
const AppError = require('./AppError');

function notFound(req, res) {
  res.status(404).json({ message: 'Rota não encontrada.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return res.status(400).json({ message: first ? first.message : 'Dados inválidos.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Requisição grande demais.' });
  }
  console.error('Erro inesperado:', err);
  res.status(500).json({ message: 'Erro interno do servidor.' });
}

module.exports = { notFound, errorHandler };
