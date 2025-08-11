const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../utils/error');
const { auth } = require('../middlewares/auth');

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar um novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Lucas
 *               email:
 *                 type: string
 *                 example: lucas@mail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 */
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('name é obrigatório'),
    body('email').isEmail().withMessage('email inválido'),
    body('password').isLength({ min: 6 }).withMessage('password mínimo 6 chars')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new AppError(JSON.stringify(errors.array()), 422);

      const { name, email, password } = req.body;
      const exists = await User.findOne({ email });
      if (exists) throw new AppError('Email já cadastrado', 409);

      const user = await User.create({ name, email, password });

      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        subject: String(user._id),
        expiresIn: process.env.JWT_EXPIRES_IN
      });

      res.status(201).json({
        user: { id: user._id, name: user.name, email: user.email },
        token
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autenticar usuário e gerar token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: lucas@mail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Token gerado
 */
router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new AppError(JSON.stringify(errors.array()), 422);

      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) throw new AppError('Credenciais inválidas', 401);

      const ok = await user.comparePassword(password);
      if (!ok) throw new AppError('Credenciais inválidas', 401);

      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        subject: String(user._id),
        expiresIn: process.env.JWT_EXPIRES_IN
      });

      res.json({
        user: { id: user._id, name: user.name, email: user.email },
        token
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Retorna dados do usuário logado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário autenticado
 */
router.get('/me', auth, async (req, res) => {
  const me = await User.findById(req.user.id).select('_id name email createdAt');
  res.json(me);
});

module.exports = router;
