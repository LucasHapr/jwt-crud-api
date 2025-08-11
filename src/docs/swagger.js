const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'JWT CRUD API',
      version: '1.0.0',
      description: 'API REST com autenticação JWT e CRUD de produtos'
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        Login: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'lucas@mail.com' },
            password: { type: 'string', example: '123456' }
          }
        },
        Register: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Lucas' },
            email: { type: 'string', example: 'lucas@mail.com' },
            password: { type: 'string', example: '123456' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Teclado' },
            description: { type: 'string', example: 'Mecânico' },
            price: { type: 'number', example: 199.9 },
            stock: { type: 'integer', example: 10 },
            active: { type: 'boolean', example: true },
            owner: { type: 'string' }
          }
        }
      }
    }
  },
  // Varra suas rotas com JSDoc
  apis: ['src/routes/*.js'],
};

const specs = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  specs
};
