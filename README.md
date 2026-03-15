# DocumentAI

A full-stack application with a Node.js backend, ChromaDB vector store, and a frontend dev server.

---

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [ChromaDB](https://www.trychroma.com/) (`pip install chromadb`)
- [Ollama](https://ollama.com/) (running locally on port `11434`)

---

## Environment Variables

Create a `.env` file inside the `backend/` directory with the following values:

```env
DB_NAME='postgres'
DB_USER='postgres'
DB_DIALECT='postgres'
DB_PASSWORD='db_password'
PORT=5000
JWT_SECRET=secret_key
GEMINI_API_KEY=API_Key
OLLAMA_URL="http://127.0.0.1:11434/api/generate"
```

---

## Installation

Install dependencies for both the backend and frontend before running anything.

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

---

## Database Setup
 
This project uses [Sequelize](https://sequelize.org/) for database migrations. Make sure your PostgreSQL server is running and your `.env` is configured before running these.
 
**Run migrations:**
```bash
cd backend
npx sequelize-cli db:migrate
```
 
**Undo the last migration** (if needed):
```bash
npx sequelize-cli db:migrate:undo
```
 
**Undo all migrations** (full reset):
```bash
npx sequelize-cli db:migrate:undo:all
```
 
---

## Running the Project

The project has three parts that need to run simultaneously. Open a separate terminal for each.

### 1. Backend Server

```bash
cd backend
npm start
```

Runs on: `http://localhost:5000`

---

### 2. ChromaDB Server

```bash
cd backend
chroma run --host localhost --port 8000 --path ./my_chroma_data
```

Runs on: `http://localhost:8000`

---

### 3. Frontend Dev Server

```bash
cd frontend
npm run dev
```

Runs on: `http://localhost:5173`

---

## Project Structure

```
├── backend/
│   ├── my_chroma_data/     # ChromaDB persistent data
│   ├── .env                # Environment variables (do not commit)
│   └── ...
├── frontend/
│   └── ...
└── README.md
```
