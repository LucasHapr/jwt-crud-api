const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const { AppError } = require('./utils/error');
const { swaggerUi, specs } = require('./docs/swagger');


const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'Node Docker API', version: '1.0.0' });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

app.use('/auth', authRoutes);
app.use('/products', productRoutes);

// 404
app.use((_req, _res, next) => next(new AppError('Rota não encontrada', 404)));

// Handler de erro
app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  let message = err.message || 'Erro interno';

  // Quando mandamos o array do express-validator serializado
  try {
    const parsed = JSON.parse(message);
    if (Array.isArray(parsed)) {
      return res.status(status).json({ errors: parsed });
    }
  } catch (_) {}

  res.status(status).json({ error: message });
});

module.exports = app;
