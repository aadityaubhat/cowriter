#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   CoWriter Automatic Linting Script    ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo -e "\n${BLUE}Checking for required tools...${NC}"
command_exists node || { echo -e "${RED}Node.js is required but not installed. Aborting.${NC}" >&2; exit 1; }
command_exists npm || { echo -e "${RED}npm is required but not installed. Aborting.${NC}" >&2; exit 1; }
command_exists python3 || { echo -e "${RED}Python 3 is required but not installed. Aborting.${NC}" >&2; exit 1; }
command_exists poetry || { echo -e "${RED}Poetry is required but not installed. Aborting.${NC}" >&2; exit 1; }
echo -e "${GREEN}All required tools are installed.${NC}"

# Function to run a command and report its status
run_command() {
    local cmd="$1"
    local description="$2"
    
    echo -e "\n${YELLOW}Running: ${description}${NC}"
    eval $cmd
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success: ${description}${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed: ${description}${NC}"
        return 1
    fi
}

# Frontend linting
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}   Frontend Linting (co_writer)         ${NC}"
echo -e "${BLUE}=========================================${NC}"

cd co_writer || { echo -e "${RED}Frontend directory not found. Aborting.${NC}" >&2; exit 1; }

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install || npm install --legacy-peer-deps
fi

# Run ESLint with auto-fix
run_command "npm run lint -- --fix" "ESLint with auto-fix"
frontend_lint_status=$?

# Run Prettier to format code
run_command "npm run format" "Prettier formatting"
frontend_format_status=$?

# Run TypeScript type checking
run_command "npm run type-check" "TypeScript type checking"
frontend_type_status=$?

# Return to root directory
cd ..

# Backend linting
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}   Backend Linting (backend)            ${NC}"
echo -e "${BLUE}=========================================${NC}"

cd backend || { echo -e "${RED}Backend directory not found. Aborting.${NC}" >&2; exit 1; }

# Install dependencies if needed
if [ ! -f "poetry.lock" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    poetry install
fi

# Format with Black
run_command "poetry run black ." "Black code formatting"
backend_black_status=$?

# Sort imports with isort
run_command "poetry run isort ." "isort import sorting"
backend_isort_status=$?

# Run flake8 (cannot auto-fix)
run_command "poetry run flake8" "flake8 linting"
backend_flake8_status=$?

# Run mypy type checking
run_command "poetry run mypy app/" "mypy type checking"
backend_mypy_status=$?

# Return to root directory
cd ..

# Summary
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}   Linting Summary                      ${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "\n${YELLOW}Frontend:${NC}"
[ $frontend_lint_status -eq 0 ] && echo -e "${GREEN}✓ ESLint: Passed${NC}" || echo -e "${RED}✗ ESLint: Failed${NC}"
[ $frontend_format_status -eq 0 ] && echo -e "${GREEN}✓ Prettier: Passed${NC}" || echo -e "${RED}✗ Prettier: Failed${NC}"
[ $frontend_type_status -eq 0 ] && echo -e "${GREEN}✓ TypeScript: Passed${NC}" || echo -e "${RED}✗ TypeScript: Failed${NC}"

echo -e "\n${YELLOW}Backend:${NC}"
[ $backend_black_status -eq 0 ] && echo -e "${GREEN}✓ Black: Passed${NC}" || echo -e "${RED}✗ Black: Failed${NC}"
[ $backend_isort_status -eq 0 ] && echo -e "${GREEN}✓ isort: Passed${NC}" || echo -e "${RED}✗ isort: Failed${NC}"
[ $backend_flake8_status -eq 0 ] && echo -e "${GREEN}✓ flake8: Passed${NC}" || echo -e "${RED}✗ flake8: Failed${NC}"
[ $backend_mypy_status -eq 0 ] && echo -e "${GREEN}✓ mypy: Passed${NC}" || echo -e "${RED}✗ mypy: Failed${NC}"

# Overall status
frontend_status=$((frontend_lint_status + frontend_format_status + frontend_type_status))
backend_status=$((backend_black_status + backend_isort_status + backend_flake8_status + backend_mypy_status))
overall_status=$((frontend_status + backend_status))

echo -e "\n${BLUE}=========================================${NC}"
if [ $overall_status -eq 0 ]; then
    echo -e "${GREEN}All linting checks passed successfully!${NC}"
else
    echo -e "${RED}Some linting checks failed. Please fix the issues above.${NC}"
    
    # Provide helpful tips for fixing common issues
    echo -e "\n${YELLOW}Tips for fixing common issues:${NC}"
    echo -e "- For ESLint errors: Check the specific rules being violated"
    echo -e "- For TypeScript errors: Make sure all types are properly defined"
    echo -e "- For flake8 errors: These must be fixed manually, check the error messages"
    echo -e "- For mypy errors: Add proper type annotations to your Python code"
fi
echo -e "${BLUE}=========================================${NC}"

exit $overall_status 