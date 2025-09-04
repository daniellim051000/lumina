# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

Lumina is a full-stack desktop application with a monorepo structure containing two main components:

### Frontend (lumina-frontend/)
- **Electron + React 19 + TypeScript** desktop application
- **Vite** for development server and building
- **Two-process architecture**: Electron main process (`src/main.ts`) and React renderer
- **API communication** through centralized service class (`src/services/api.ts`)
- **Environment variables** prefixed with `VITE_` (e.g., `VITE_API_BASE_URL`)

### Backend (lumina-backend/)  
- **Django REST Framework** API server
- **PostgreSQL** database running in Docker
- **CORS enabled** for Electron frontend communication
- **Environment variables** managed via `python-decouple` and `.env` files
- **Single API app** with health/info endpoints

### Development Workflow
The application requires **4 concurrent processes** for full development:
1. PostgreSQL database (Docker)
2. Django API server (port 8000)
3. React dev server (port 3000)
4. Electron main process (loads from localhost:3000 in dev mode)

## Essential Commands

### Database Setup
```bash
# Start PostgreSQL (required first)
docker-compose up postgres -d

# Optional: Start with PgAdmin UI
docker-compose --profile dev-tools up -d
```

### Backend Development
```bash
cd lumina-backend
source venv/bin/activate  # Always activate venv first

# Development server
python manage.py runserver

# Database operations
python manage.py migrate
python manage.py makemigrations
python manage.py createsuperuser

# Code quality
ruff check . --fix
ruff format .
pre-commit run --all-files
```

### Frontend Development
```bash
cd lumina-frontend

# Development (requires React dev server + Electron)
yarn dev-react    # Terminal 1: Start React dev server
yarn dev         # Terminal 2: Start Electron (after React is running)

# Building
yarn build-react   # Build React app to /build
yarn build-electron # Compile TypeScript to /dist  
yarn build         # Build both

# Code quality
yarn lint:fix
yarn format
```

## Key Architecture Patterns

### Frontend-Backend Communication
- **API Base URL**: Configured via `VITE_API_BASE_URL` environment variable
- **Service Pattern**: All API calls go through `apiService` singleton in `src/services/api.ts`
- **Type Safety**: TypeScript interfaces defined for all API responses
- **Error Handling**: Centralized in the `ApiService.request()` method

### Environment Configuration
- **Frontend**: Uses Vite's `import.meta.env.VITE_*` pattern
- **Backend**: Uses `python-decouple` with `config()` function
- **Sample Files**: `.env.sample` files provided for both frontend and backend
- **CORS**: Backend allows localhost:3000 and 127.0.0.1:3000 by default

### Build System
- **Frontend**: Vite builds React to `/build`, TypeScript compiles Electron to `/dist`
- **Electron Main**: Points to `dist/main.js`, loads from `build/index.html` (production) or `localhost:3000` (development)
- **Development Mode**: Detected via `NODE_ENV=development` environment variable

### Code Quality
- **Backend**: Ruff linter/formatter + pre-commit hooks with MyPy type checking
- **Frontend**: ESLint + Prettier + Husky + lint-staged pre-commit hooks
- **Django**: Configured with `rest_framework`, `corsheaders`, and custom `api` app

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Lumina
VITE_APP_VERSION=1.0.0
```

### Backend (.env)
```
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=lumina_db
DB_USER=lumina_user  
DB_PASSWORD=lumina_password
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Development Setup Sequence

When setting up or debugging, follow this order:
1. **Copy environment files**: `cp *.env.sample *.env` for both frontend/backend
2. **Start database**: `docker-compose up postgres -d` 
3. **Setup backend**: Create venv, install deps, run migrations
4. **Setup frontend**: `yarn install`
5. **Start development**: Backend server → React dev server → Electron app

## Common Troubleshooting

- **Port 5432 in use**: Another PostgreSQL instance is running
- **Frontend can't connect**: Check CORS settings in Django settings and ensure backend is on port 8000
- **Electron blank screen**: React dev server must be running first on port 3000
- **Pre-commit failing**: Run linting/formatting manually before committing