# AI Assistant Guidelines for Docker Swarm Terminal

## Critical Testing Requirements

**NEVER commit code without verifying it works with the existing tests.**

### Before Making Any Changes

1. **Read the test files first** - Understand what the tests expect
   - E2E tests: `frontend/e2e/*.spec.ts`
   - Unit tests: `frontend/**/__tests__/*.test.tsx`

2. **Understand the test expectations** - Check for:
   - Button text and labels (e.g., tests expect "Sign In", not "Access Dashboard")
   - Component structure and roles
   - User interactions and flows

### Testing Workflow

When making changes to components or functionality:

1. **Read the relevant test file(s)** before changing code
   ```bash
   # For login changes, read:
   cat frontend/e2e/login.spec.ts
   cat frontend/components/__tests__/LoginForm.test.tsx
   ```

2. **Make your changes** ensuring they match test expectations

3. **Verify tests pass** - You MUST verify tests before committing:

   **If Docker is available:**
   ```bash
   # Build the FULL frontend Docker image (runs unit tests + e2e tests)
   cd frontend && docker build -t frontend-test .
   ```

   **If Docker is NOT available:**
   ```bash
   cd frontend
   # Step 1: Install dependencies
   npm ci

   # Step 2: Run unit tests
   npm test

   # Step 3: Build the app (catches TypeScript/build errors)
   npm run build

   # Step 4: Read e2e test files to verify your changes match expectations
   cat e2e/login.spec.ts  # or relevant test file
   ```

4. **Only commit if tests pass** - If tests fail, fix the code, don't change the tests unless the tests are genuinely wrong

### Common Mistakes to Avoid

- ❌ Changing button text without checking what tests expect
- ❌ Modifying component structure without verifying e2e selectors
- ❌ Assuming tests will adapt to your changes
- ❌ Committing without running tests

### Test Structure

- **Unit tests**: Test individual components in isolation
- **E2E tests**: Test user workflows in Playwright
  - Tests use `getByRole()`, `getByLabel()`, and `getByText()` selectors
  - These selectors are case-insensitive with `/i` flag
  - Button text must match exactly what tests query for

### When Tests Fail

1. **Read the error message carefully** - It shows exactly what's missing
2. **Check the test file** - See what text/structure it expects
3. **Fix the code to match** - Don't change tests unless they're genuinely wrong
4. **Verify the fix** - Run tests again before committing

## Development Commands

```bash
# Run all tests in Docker (CI environment)
docker build --target test .

# Run e2e tests locally (requires dependencies)
cd frontend && npm run test:e2e

# Run unit tests locally
cd frontend && npm test

# Run specific test file
cd frontend && npm test -- LoginForm
```

## Project Structure

- `frontend/` - Next.js application
  - `components/` - React components
  - `e2e/` - Playwright end-to-end tests
  - `lib/hooks/` - Custom React hooks
- `backend/` - Go backend service
- `docker-compose.yml` - Local development setup
- `Dockerfile` - Multi-stage build with test target

## Git Workflow

1. Always work on feature branches starting with `claude/`
2. Commit messages should explain WHY, not just WHAT
3. Push to the designated branch only
4. Tests must pass in CI before merging

Remember: **Code that doesn't pass tests is broken code.** Always verify before committing.
