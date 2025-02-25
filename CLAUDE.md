# CoWriter Codebase Guidelines

## Build/Run Commands
- **Run application**: `./run.sh` (starts both frontend and backend)
- **Setup project**: `./setup.sh` (installs dependencies)
- **Lint all code**: `./lint.sh` (runs all linters with auto-fix)

### Frontend (Next.js)
- **Run dev server**: `cd co_writer && npm run dev`
- **Lint**: `cd co_writer && npm run lint [--fix]`
- **Format code**: `cd co_writer && npm run format`
- **Type check**: `cd co_writer && npm run type-check`

### Backend (FastAPI)
- **Run dev server**: `cd backend && poetry run uvicorn app.main:app --reload`
- **Format code**: `cd backend && poetry run black .`
- **Sort imports**: `cd backend && poetry run isort .`
- **Run linter**: `cd backend && poetry run flake8`
- **Type check**: `cd backend && poetry run mypy app/`
- **Run tests**: `cd backend && poetry run pytest`
- **Run single test**: `cd backend && poetry run pytest path/to/test_file.py::test_function_name`

## Code Style Guidelines
- **TypeScript**: Use strict typing, 2-space indentation, 100 chars line limit, single quotes
- **Python**: Type annotations required, 100 chars line limit, Google docstring style
- **Imports**: Sorted with isort in Python, no unused imports in either language
- **Naming**: camelCase for JS/TS, snake_case for Python, PascalCase for React components
- **Error handling**: Proper error types and informative messages, no swallowed exceptions
- **No console.log**: Use structured logging instead (console.warn/error allowed)
- **Formatting enforced**: Prettier for frontend, Black for backend