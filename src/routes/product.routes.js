const { Router } = require('express');
const { body, validationResult, param, query } = require('express-validator');
const Product = require('../models/Product');
const { AppError } = require('../utils/error');
const { auth } = require('../middlewares/auth');

const router = Router();

// GET /products?search=&page=&limit=&sort=price,-createdAt
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Lista todos os produtos
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de produtos
 */
router.get(
  '/',
  [
    query('page').optional().toInt().isInt({ min: 1 }),
    query('limit').optional().toInt().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('sort').optional().isString()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new AppError(JSON.stringify(errors.array()), 422);

      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
      const skip = (page - 1) * limit;

      const filter = { active: true };
      if (req.query.search) {
        filter.$text = { $search: req.query.search };
      }

      let sort = { createdAt: -1 };
      if (req.query.sort) {
        // ex: price,-createdAt
        sort = {};
        req.query.sort.split(',').forEach((field) => {
          if (field.startsWith('-')) sort[field.slice(1)] = -1;
          else sort[field] = 1;
        });
      }

      const [items, total] = await Promise.all([
        Product.find(filter).sort(sort).skip(skip).limit(limit),
        Product.countDocuments(filter)
      ]);

      res.json({
        page,
        limit,
        total,
        items
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /products/:id
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Busca produto pelo ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:id', [param('id').isMongoId()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(JSON.stringify(errors.array()), 422);
    const item = await Product.findById(req.params.id);
    if (!item || !item.active) throw new AppError('Produto não encontrado', 404);
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /products (auth)
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Cria um novo produto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: Teclado
 *               price:
 *                 type: number
 *                 example: 199.9
 *               description:
 *                 type: string
 *                 example: Mecânico
 *               stock:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: Produto criado
 */
router.post(
  '/',
  auth,
  [
    body('name').notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('description').optional().isString(),
    body('stock').optional().isInt({ min: 0 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new AppError(JSON.stringify(errors.array()), 422);

      const data = {
        name: req.body.name,
        description: req.body.description || '',
        price: req.body.price,
        stock: req.body.stock || 0,
        owner: req.user.id
      };
      const created = await Product.create(data);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /products/:id (auth, dono)
/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Atualiza um produto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               stock: { type: integer }
 *               description: { type: string }
 *               active: { type: boolean }
 *     responses:
 *       200:
 *         description: Produto atualizado
 */
router.patch(
  '/:id',
  auth,
  [
    param('id').isMongoId(),
    body('name').optional().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('description').optional().isString(),
    body('stock').optional().isInt({ min: 0 }),
    body('active').optional().isBoolean()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new AppError(JSON.stringify(errors.array()), 422);

      const product = await Product.findById(req.params.id);
      if (!product || !product.active) throw new AppError('Produto não encontrado', 404);
      if (String(product.owner) !== req.user.id) throw new AppError('Sem permissão', 403);

      Object.assign(product, req.body);
      await product.save();
      res.json(product);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /products/:id (soft delete)
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Remove um produto (soft delete)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Produto removido
 */
router.delete('/:id', auth, [param('id').isMongoId()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(JSON.stringify(errors.array()), 422);

    const product = await Product.findById(req.params.id);
    if (!product || !product.active) throw new AppError('Produto não encontrado', 404);
    if (String(product.owner) !== req.user.id) throw new AppError('Sem permissão', 403);

    product.active = false;
    await product.save();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
