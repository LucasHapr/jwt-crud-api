# 🚀 JWT CRUD API — Node.js + Docker + MongoDB + Swagger
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED)](https://www.docker.com/)
[![Node](https://img.shields.io/badge/Node-20.x-339933)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248)](https://www.mongodb.com/)
[![Swagger](https://img.shields.io/badge/OpenAPI-3.0-85EA2D)](https://swagger.io/)

API RESTful com autenticação **JWT**, CRUD de **produtos**, paginação, busca full-text, documentação com **Swagger** e ambiente **containerizado** via Docker Compose. 


## ✨ Features
- Login/Registro com **JWT** (Bearer)
- CRUD de **Produtos** (+ soft delete)
- **Paginação**, **ordenação** e **busca** (`$text`)
- Validação com **express-validator**
- Logs com **morgan** e CORS habilitado
- **Swagger UI** em `/docs` e OpenAPI em `/openapi.json`
- Ambiente **Docker**: API + MongoDB + (opcional) Mongo Express

## 🧱 Stack
Node 20, Express 5, Mongoose 8, JWT, Bcrypt, Docker Compose

## 🧭 Arquitetura (resumo)
src/
app.js
server.js
config/db.js
middlewares/auth.js
models/{User,Product}.js
routes/{auth,product}.routes.js
utils/error.js
docs/swagger.js


## 🐳 Rodando com Docker
```bash
cp .env.example .env  # (ou crie o seu)
docker compose up --build
# API: http://localhost:3000
# Swagger: http://localhost:3000/docs
# Mongo Express (se habilitado): http://localhost:8081
```
## .env (exemplo)
```bash
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://root:root@mongo:27017/portfolio_api?authSource=admin
JWT_SECRET=troque_esta_chave
JWT_EXPIRES_IN=7d
```
## 🔑 Autenticação
Envie o header:

```bash
Authorization: Bearer <token>
```
nas rotas protegidas.

## 🧪 Endpoints principais
- `POST /auth/register` — cria um novo usuário e retorna token.
- `POST /auth/login` — retorna token de acesso.
- `GET  /auth/me` — retorna dados do usuário logado.
- `GET  /products` — lista produtos com filtros (`search`, `page`, `limit`, `sort`).
- `POST /products` — cria produto (requer login).
- `GET  /products/:id` — retorna um produto pelo ID.
- `PATCH /products/:id` — atualiza produto (somente dono).
- `DELETE /products/:id` — remove (soft delete) produto (somente dono).

---

## 📑 Documentação
- **Swagger UI:** [https://jwt-crud-api.onrender.com/docs](https://jwt-crud-api.onrender.com/docs)

---

## 🛠️ Scripts
```bash
npm run dev   # ambiente de desenvolvimento com nodemon
npm start     # ambiente de produção com node
```