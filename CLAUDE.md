# AI Assistant Guidelines for Docker Swarm Terminal

## Prerequisites

Before working on this project, ensure you have:

- **Node.js 20+** - Required for frontend development
- **Docker** - Required for running CI-equivalent tests (optional but recommended)
- **GitHub CLI (gh)** - Required for creating pull requests

### Installing Docker

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

**macOS:**
```bash
brew install --cask docker
# Or download Docker Desktop from https://www.docker.com/products/docker-desktop
```

**Verify installation:**
```bash
docker --version
docker ps
```

### Installing GitHub CLI

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install gh
```

**macOS:**
```bash
brew install gh
```

**Verify installation:**
```bash
gh --version
gh auth status
```

**Authenticate:**
```bash
gh auth login
```

## Critical Testing Requirements

**NEVER commit code without verifying it works with the existing tests.**

**CRITICAL: You MUST keep working until ALL tests pass and coverage is maintained.**
- ❌ Do NOT commit if ANY test fails
- ❌ Do NOT commit if the build fails
- ❌ Do NOT commit if coverage drops
- ✅ Keep iterating and fixing until 100% of tests pass
- ✅ Only commit when the FULL test suite passes

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

   **Option A: Local testing with e2e (RECOMMENDED):**
   ```bash
   cd frontend

   # Step 1: Install dependencies
   npm ci

   # Step 2: Run unit tests (REQUIRED - must pass)
   npm test

   # Step 3: Build the app (REQUIRED - must succeed)
   npm run build

   # Step 4: Run e2e tests with mock backend (automatically starts servers)
   npx playwright install chromium --with-deps
   npm run test:e2e
   ```

   **Note:** Playwright automatically starts:
   - Mock backend server on port 5000 (`e2e/mock-backend.js`)
   - Frontend dev server on port 3000 (`npm run dev`)
   - Both servers shut down automatically when tests complete

   **Option B: Full Docker build (CI-equivalent):**
   ```bash
   cd frontend && docker build -t frontend-test .
   ```

   **Warning:** The Dockerfile runs e2e tests at line 55 but allows them to skip
   if backend services aren't running. In CI, e2e tests may show failures but
   won't block the build. Always run Option A locally to catch issues early.

   **Option C: Minimum verification (if e2e cannot run):**
   ```bash
   cd frontend
   npm ci          # Install dependencies
   npm test        # Run unit tests - MUST PASS
   npm run build   # Build app - MUST SUCCEED

   # Manually verify e2e expectations by reading test files
   cat e2e/login.spec.ts
   cat e2e/dashboard.spec.ts
   cat e2e/terminal.spec.ts

   # Check your component changes match what the e2e tests expect:
   # - Button text and labels (e.g., "Sign In" not "Access Dashboard")
   # - Heading text (e.g., "Sign In" not "Container Shell")
   # - Component roles and structure
   # - User interaction flows
   ```

4. **Keep working until ALL tests pass**

   **CRITICAL REQUIREMENT:**
   - If ANY unit test fails → Fix the code and re-run until ALL pass
   - If the build fails → Fix the code and re-run until it succeeds
   - If ANY e2e test fails → Fix the code and re-run until ALL pass
   - If you can't run e2e tests → Manually verify changes match ALL e2e expectations
   - Do NOT commit partial fixes or "good enough" code
   - ONLY commit when the FULL test suite passes (282/282 unit tests, 11/11 e2e tests)

   **Your responsibility:** Keep iterating and fixing until you achieve 100% test success.

### Common Mistakes to Avoid

- ❌ Changing button text without checking what tests expect
- ❌ Modifying component structure without verifying e2e selectors
- ❌ Assuming tests will adapt to your changes
- ❌ Committing without running tests
- ❌ Committing when ANY test fails (even if "most" tests pass)
- ❌ Committing with the intention to "fix it later"
- ❌ Stopping work when 9/11 e2e tests pass (you need 11/11!)
- ❌ Thinking test failures are "acceptable" or "good enough"

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
# Install frontend dependencies
cd frontend && npm ci

# Run unit tests
cd frontend && npm test

# Run specific unit test file
cd frontend && npm test -- LoginForm

# Run unit tests with coverage
cd frontend && npm run test:coverage

# Build the frontend
cd frontend && npm run build

# Run e2e tests (auto-starts mock backend + dev server)
cd frontend && npm run test:e2e

# Run specific e2e test
cd frontend && npx playwright test login.spec.ts

# Run e2e tests with UI (for debugging)
cd frontend && npm run test:e2e:ui

# Build frontend Docker image (runs all tests)
cd frontend && docker build -t frontend-test .
```

## Mock Backend for E2E Tests

The project includes a mock backend (`frontend/e2e/mock-backend.js`) that:
- Runs on `http://localhost:5000`
- Provides mock API endpoints for login, containers, etc.
- Automatically starts when running `npm run test:e2e`
- No manual setup required

**Mock credentials:**
- Username: `admin`
- Password: `admin123`

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

## Troubleshooting

### Playwright browser installation fails

If `npx playwright install` fails with network errors:
```bash
# Try manual download
curl -L -o /tmp/chrome.zip "https://cdn.playwright.dev/builds/cft/[VERSION]/linux64/chrome-linux64.zip"
mkdir -p ~/.cache/ms-playwright/chromium_headless_shell-[VERSION]
cd ~/.cache/ms-playwright/chromium_headless_shell-[VERSION]
unzip /tmp/chrome.zip
mv chrome-linux64 chrome-headless-shell-linux64
cd chrome-headless-shell-linux64 && cp chrome chrome-headless-shell
```

### E2E tests fail with "ERR_CONNECTION_REFUSED"

The mock backend or dev server isn't starting. Check:
```bash
# Make sure ports 3000 and 5000 are free
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9

# Verify Playwright config is correct
cat frontend/playwright.config.ts | grep webServer
```

### Docker build fails

```bash
# Check Docker is running
docker ps

# Build with more verbose output
cd frontend && docker build --progress=plain -t frontend-test .

# Build specific stage only
cd frontend && docker build --target test -t frontend-unit-tests .
```

### Tests expect different text than component shows

**Always read the test files first before making changes!**
```bash
# Find what text the tests expect
grep -r "getByRole\|getByText\|getByLabel" frontend/e2e/
grep -r "getByRole\|getByText\|getByLabel" frontend/**/__tests__/
```

## Summary: Complete Workflow

1. ✅ **Read test files** to understand expectations
2. ✅ **Make changes** matching what tests expect
3. ✅ **Run unit tests**: `npm test` → MUST show 282/282 passing
4. ✅ **Run build**: `npm run build` → MUST succeed with no errors
5. ✅ **Run e2e tests**: `npm run test:e2e` → MUST show 11/11 passing
6. ✅ **Fix failures**: If ANY test fails, go back to step 2 and fix the code
7. ✅ **Iterate**: Repeat steps 2-6 until 100% of tests pass
8. ✅ **Commit**: ONLY after achieving full test suite success
9. ✅ **Push**: To designated branch

**Acceptance Criteria Before Committing:**
- ✅ 282/282 unit tests passing (100%)
- ✅ Build succeeds with zero errors
- ✅ 11/11 e2e tests passing (100%)
- ✅ No test coverage regression

Remember: **Code that doesn't pass the FULL test suite is broken code.**

**If tests fail, you MUST fix them before committing. No exceptions.**
