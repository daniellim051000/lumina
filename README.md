# Lumina Desktop Application

A modern full-stack desktop application built with Electron, React, TypeScript, and Django REST Framework.

## 🏗️ Architecture

- **Frontend**: Electron + React 19 + TypeScript + Vite
- **Backend**: Django REST Framework + PostgreSQL
- **Development**: Docker Compose for database
- **Code Quality**: Pre-commit hooks with Ruff (backend) & Husky + lint-staged (frontend)

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.11+
- Docker and Docker Compose
- Git

### 1. Clone and Setup Environment
```bash
git clone <your-repo-url>
cd lumina

# Copy environment files
cp lumina-frontend/.env.sample lumina-frontend/.env
cp lumina-backend/.env.sample lumina-backend/.env

# Edit .env files with your configuration
```

### 2. Backend Setup
```bash
cd lumina-backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install pre-commit hooks
pre-commit install
```

### 3. Frontend Setup
```bash
cd lumina-frontend

# Install dependencies
yarn install
```

### 4. Start Development Environment
```bash
# Terminal 1: Start database
docker-compose up postgres -d

# Terminal 2: Start backend
cd lumina-backend
source venv/bin/activate
python manage.py migrate
python manage.py runserver

# Terminal 3: Start React dev server
cd lumina-frontend
yarn dev-react

# Terminal 4: Start Electron app
cd lumina-frontend
yarn dev
```

## 🌐 Available Services

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | Electron App | Desktop application |
| **React Dev Server** | http://localhost:3000 | Hot-reload development server |
| **Backend API** | http://localhost:8000/api/ | Django REST Framework API |
| **Database** | localhost:5432 | PostgreSQL database |
| **PgAdmin** (optional) | http://localhost:5050 | Database management interface |

### 🔌 API Endpoints
- `GET /api/health/` - Health check endpoint
- `GET /api/info/` - API information and configuration

## 🛠️ Development Commands

### Frontend Commands
```bash
cd lumina-frontend

# Development
yarn dev-react     # Start React dev server (port 3000)
yarn dev           # Run Electron in development mode
yarn build-react   # Build React for production
yarn build-electron # Compile TypeScript for Electron
yarn build         # Build both React and Electron

# Code Quality
yarn lint          # Run ESLint
yarn lint:fix      # Fix ESLint issues automatically
yarn format        # Format code with Prettier
yarn format:check  # Check code formatting

# Utilities
yarn clean         # Clean build directories
yarn rebuild       # Clean and rebuild everything
```

### Backend Commands
```bash
cd lumina-backend
source venv/bin/activate

# Development
python manage.py runserver      # Start Django development server
python manage.py migrate        # Run database migrations
python manage.py makemigrations # Create new migrations
python manage.py createsuperuser # Create admin user

# Testing
python -m pytest               # Run all tests with coverage
python -m pytest -v            # Verbose test output
python -m pytest --tb=short    # Short traceback format
python -m pytest -k "test_name" # Run specific tests by pattern
python -m pytest api/user/tests/ # Run tests for specific app
python -m pytest --cov=api --cov-report=term # Coverage report in terminal
python -m pytest --cov=api --cov-report=html # HTML coverage report
python -m pytest -n auto       # Run tests in parallel (requires pytest-xdist)
python -m pytest -m unit       # Run only unit tests
python -m pytest -m integration # Run only integration tests

# Code Quality
ruff check .                    # Check code with Ruff
ruff check . --fix             # Fix issues automatically
ruff format .                  # Format code
pre-commit run --all-files     # Run pre-commit hooks on all files

# Database
python manage.py shell         # Django shell
python manage.py dbshell       # Database shell
```

### Docker Commands
```bash
# Database only
docker-compose up postgres -d

# With PgAdmin (database management UI)
docker-compose --profile dev-tools up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs postgres
```

## 📁 Project Structure

```
lumina/
├── .husky/                   # Git hooks (Husky)
├── lumina-frontend/          # Electron + React app
│   ├── .husky/              # Frontend git hooks
│   ├── src/
│   │   ├── main.ts          # Electron main process
│   │   ├── preload.ts       # Electron preload script
│   │   ├── App.tsx          # React main component
│   │   ├── main.tsx         # React entry point
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript type definitions
│   ├── build/               # Built React app
│   ├── dist/                # Compiled Electron app
│   ├── package.json
│   ├── vite.config.ts       # Vite configuration
│   ├── tsconfig.json        # TypeScript configuration
│   ├── eslint.config.js     # ESLint configuration
│   ├── .prettierrc          # Prettier configuration
│   ├── .env.sample          # Environment template
│   └── .gitignore
├── lumina-backend/           # Django REST API
│   ├── lumina/              # Django project settings
│   ├── api/                 # API application
│   ├── venv/                # Python virtual environment
│   ├── manage.py
│   ├── requirements.txt     # Python dependencies
│   ├── pyproject.toml       # Ruff configuration
│   ├── .pre-commit-config.yaml # Pre-commit hooks config
│   ├── .env.sample          # Environment template
│   └── .gitignore
├── docker-compose.yml        # Database services
└── README.md
```

## 🔧 Configuration

### Environment Variables

**Frontend** (`.env`):
```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Lumina
VITE_APP_VERSION=1.0.0
```

**Backend** (`.env`):
```bash
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=lumina_db
DB_USER=lumina_user
DB_PASSWORD=lumina_password
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 🚀 Production Build

### Frontend
```bash
cd lumina-frontend
yarn build
yarn start  # Run built Electron app
```

### Backend
```bash
cd lumina-backend
source venv/bin/activate
python manage.py collectstatic
# Configure production database and WSGI server
```

## 🧪 Testing

### Backend Testing (pytest)
The backend uses **pytest** with comprehensive test coverage:

```bash
cd lumina-backend
source venv/bin/activate

# Run all tests (includes coverage reporting)
python -m pytest

# Common test commands
python -m pytest -v --tb=short                    # Verbose with short tracebacks
python -m pytest api/user/tests/                  # Test specific app
python -m pytest -k "test_login"                  # Run tests matching pattern
python -m pytest -m unit                          # Run only unit tests
python -m pytest -m integration                   # Run only integration tests
python -m pytest -n auto                          # Parallel execution
```

**Test Structure:**
- `api/user/tests/` - User authentication & management tests
- `api/task/tests/` - Task management API tests
- **Coverage target**: 90% minimum
- **Test types**: Unit tests, Integration tests, API endpoint tests

**Coverage Reports:**
- Terminal: `--cov-report=term`
- HTML: `--cov-report=html` (generates `htmlcov/` directory)

### Frontend Testing
Frontend testing setup can be added as needed for React components.

## 🔧 Code Quality & Pre-commit Hooks

### Backend (Ruff + Pre-commit)
- **Ruff**: Fast Python linter and formatter
- **pytest**: Test runner with coverage reporting
- **Pre-commit**: Automatically runs on git commits

### Frontend (ESLint + Prettier + Husky)
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Husky + lint-staged**: Git hooks for staged files

## 🐛 Troubleshooting

### Common Issues

1. **Port 5432 already in use**
   ```bash
   # Stop other PostgreSQL services or change port in docker-compose.yml
   ```

2. **Frontend can't connect to backend**
   - Ensure backend is running on port 8000
   - Check CORS configuration in Django settings
   - Verify `VITE_API_BASE_URL` in frontend `.env`

3. **Pre-commit hooks failing**
   ```bash
   # Backend
   cd lumina-backend && ruff check . --fix
   
   # Frontend
   cd lumina-frontend && yarn lint:fix && yarn format
   ```

4. **Database connection issues**
   - Ensure PostgreSQL container is running: `docker ps`
   - Check database credentials in `.env`
   - Run migrations: `python manage.py migrate`

## 📝 Development Workflow

1. **Feature Development**:
   - Create feature branch
   - Make changes (pre-commit hooks run automatically)
   - Test end-to-end functionality
   - Create pull request

2. **Testing Full Stack**:
   - Start all services (database, backend, frontend)
   - Verify API connectivity in Electron app
   - Check developer console for errors
   - Test on different platforms (macOS, Windows, Linux)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (pre-commit hooks will run)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.