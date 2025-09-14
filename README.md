# Lumina Desktop Application

A modern full-stack desktop task management and productivity application built with Electron, React, TypeScript, and Django REST Framework.

## ✨ Features

- **Task Management**: Create, organize, and track tasks with projects, labels, and priorities
- **Pomodoro Timer**: Built-in Pomodoro timer with customizable presets and session tracking
- **User Authentication**: Secure JWT-based authentication with refresh tokens
- **Modern UI**: Responsive design with collapsible sidebar and dark/light theme support
- **Real-time Updates**: Toast notifications for user feedback
- **Internationalization**: Multi-language support (work in progress)

## 🏗️ Architecture

- **Frontend**: Electron + React 19 + TypeScript + Vite 7.x
- **Backend**: Django REST Framework + PostgreSQL
- **Styling**: Tailwind CSS 4.x with custom design system
- **Testing**: Vitest (frontend) + pytest (backend)
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

#### Common Endpoints
- `GET /api/health/` - Health check endpoint
- `GET /api/info/` - API information and configuration

#### Authentication (`/api/auth/`)
- `POST /api/auth/signup/` - User registration
- `POST /api/auth/signin/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/profile/` - Get user profile
- `POST /api/auth/change-password/` - Change user password

#### Task Management
- `GET/POST /api/projects/` - List/create projects
- `GET/PUT/DELETE /api/projects/<id>/` - Project details
- `GET/POST /api/labels/` - List/create labels
- `GET/PUT/DELETE /api/labels/<id>/` - Label details
- `GET/POST /api/tasks/` - List/create tasks
- `GET/PUT/DELETE /api/tasks/<id>/` - Task details
- `POST /api/tasks/quick/` - Quick task creation
- `POST /api/tasks/bulk/` - Bulk task update
- `GET /api/tasks/stats/` - Task statistics
- `GET/POST /api/tasks/<id>/comments/` - Task comments

#### Pomodoro Timer (`/api/pomodoro/`)
- `GET/POST /api/pomodoro/settings/` - Timer settings
- `GET/POST /api/pomodoro/presets/` - Timer presets
- `GET/POST /api/pomodoro/sessions/` - Timer sessions
- `POST /api/pomodoro/sessions/<id>/start/` - Start session
- `POST /api/pomodoro/sessions/<id>/pause/` - Pause session
- `POST /api/pomodoro/sessions/<id>/resume/` - Resume session
- `POST /api/pomodoro/sessions/<id>/complete/` - Complete session

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

# Testing
yarn test          # Run tests in watch mode with Vitest
yarn test:run      # Run tests once
yarn test:coverage # Run tests with coverage report

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
│   ├── public/              
│   │   └── locales/         # Internationalization files
│   ├── src/
│   │   ├── main.ts          # Electron main process
│   │   ├── preload.ts       # Electron preload script
│   │   ├── App.tsx          # React main component
│   │   ├── main.tsx         # React entry point
│   │   ├── components/      # React components
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── task/        # Task management components
│   │   │   ├── timer/       # Pomodoro timer components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   └── Sidebar/     # Navigation sidebar
│   │   ├── contexts/        # React contexts (Auth, Toast)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── i18n/            # Internationalization setup
│   │   ├── services/        # API services
│   │   ├── test/            # Test setup and utilities
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── build/               # Built React app
│   ├── dist/                # Compiled Electron app
│   ├── package.json
│   ├── vite.config.ts       # Vite configuration
│   ├── vitest.config.ts     # Vitest configuration
│   ├── tsconfig.json        # TypeScript configuration
│   ├── eslint.config.js     # ESLint configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── .prettierrc          # Prettier configuration
│   ├── .env.sample          # Environment template
│   └── .gitignore
├── lumina-backend/           # Django REST API
│   ├── lumina/              # Django project settings
│   ├── api/                 # API application
│   │   ├── common/          # Common utilities
│   │   ├── task/            # Task management module
│   │   └── user/            # User authentication module
│   ├── pomodoro/            # Pomodoro timer module
│   ├── venv/                # Python virtual environment
│   ├── manage.py
│   ├── requirements.txt     # Python dependencies
│   ├── pytest.ini           # Pytest configuration
│   ├── pyproject.toml       # Ruff configuration
│   ├── .pre-commit-config.yaml # Pre-commit hooks config
│   ├── .env.sample          # Environment template
│   └── .gitignore
├── docker-compose.yml        # Database services
├── CLAUDE.md                # AI assistant instructions
└── README.md
```

## 🛠️ Technologies & Dependencies

### Frontend Stack
- **Framework**: React 19 with TypeScript 5.x
- **Build Tool**: Vite 7.x for fast development and building
- **Desktop**: Electron 38.x for cross-platform desktop apps
- **Styling**: Tailwind CSS 4.x with custom design system
- **Testing**: Vitest 3.x with @testing-library/react
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date manipulation
- **Routing**: React Router v7 for navigation
- **State Management**: React Context API for global state
- **Code Quality**: ESLint 9.x, Prettier 3.x, Husky for git hooks

### Backend Stack
- **Framework**: Django 5.x with Django REST Framework
- **Database**: PostgreSQL 15+ with psycopg2
- **Authentication**: JWT with djangorestframework-simplejwt
- **CORS**: django-cors-headers for cross-origin requests
- **Testing**: pytest with pytest-django and pytest-cov
- **Code Quality**: Ruff for linting/formatting, pre-commit hooks
- **Environment**: python-decouple for configuration management
- **API Documentation**: drf-spectacular for OpenAPI schema

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
- `pomodoro/tests/` - Pomodoro timer tests
- **Coverage target**: 90% minimum
- **Test types**: Unit tests, Integration tests, API endpoint tests

**Coverage Reports:**
- Terminal: `--cov-report=term`
- HTML: `--cov-report=html` (generates `htmlcov/` directory)

### Frontend Testing (Vitest)
The frontend uses **Vitest** for testing React components and utilities:

```bash
cd lumina-frontend

# Run tests
yarn test              # Run tests in watch mode
yarn test:run          # Run tests once
yarn test:coverage     # Generate coverage report

# Test specific files
yarn test src/utils/   # Test specific directory
yarn test colors       # Test files matching pattern
```

**Test Structure:**
- `src/test/setup.ts` - Test configuration and setup
- `src/**/__tests__/` - Component and utility tests
- **Environment**: jsdom for browser simulation
- **Libraries**: @testing-library/react, @testing-library/user-event

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