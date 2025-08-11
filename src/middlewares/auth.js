const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/error');

function auth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError('Token não informado', 401));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new AppError('Token inválido ou expirado', 401));
  }
}

module.exports = { auth };
