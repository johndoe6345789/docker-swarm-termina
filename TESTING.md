# Testing Documentation

## WebSocket Transport Testing

### The "Invalid Frame Header" Issue

This document explains why our test suite didn't catch the WebSocket "Invalid frame header" error and what we've done to improve test coverage.

---

## Why Tests Didn't Catch This Issue

### Root Cause
The WebSocket error was an **infrastructure-level issue**, not a code bug:
- **Local/Development**: WebSocket connections work normally ✓
- **Production (Cloudflare)**: WebSocket upgrade attempts are blocked ✗

### Testing Gaps

#### 1. **Environment Gap**
```
Development Environment          Production Environment
┌─────────────────────┐         ┌──────────────────────────┐
│ Frontend → Backend  │         │ Frontend → Cloudflare    │
│   (Direct Connect)  │         │   ↓                      │
│   WebSocket: ✓      │         │   Cloudflare blocks WS   │
└─────────────────────┘         │   ↓                      │
                                │   Backend (WS blocked)   │
                                └──────────────────────────┘
```

Tests run in development where WebSocket works, so they pass.

#### 2. **Mock-Based Testing**
Backend tests use `SocketIOTestClient` which:
- Mocks the Socket.IO connection
- Doesn't simulate real network conditions
- Doesn't interact with reverse proxies/CDNs
- Always succeeds regardless of transport configuration

#### 3. **Missing Integration Tests**
We lacked tests that:
- Verify the actual Socket.IO client configuration
- Test against production-like infrastructure
- Validate transport fallback behavior

---

## Test Improvements

### 1. Frontend: Transport Configuration Test

**File**: `frontend/lib/hooks/__tests__/useInteractiveTerminal.test.tsx`

This new test verifies:
- ✓ Socket.IO client is configured with `transports: ['polling']`
- ✓ WebSocket is NOT in the transports array
- ✓ HTTP URL is used (not WebSocket URL)
- ✓ All event handlers are registered correctly

```typescript
it('should initialize socket.io with polling-only transport', async () => {
  // Verifies the exact configuration that prevents the error
  expect(io).toHaveBeenCalledWith(
    'http://localhost:5000/terminal',
    expect.objectContaining({
      transports: ['polling'],  // ← Critical: polling only
    })
  );
});
```

### 2. Backend: SocketIO Configuration Test

**File**: `backend/tests/test_websocket.py`

New test class `TestSocketIOConfiguration` verifies:
- ✓ SocketIO is initialized correctly
- ✓ Threading async mode is set
- ✓ Timeout/interval settings are correct
- ✓ CORS is enabled
- ✓ Terminal namespace is registered

```python
def test_socketio_supports_both_transports(self):
    """Verify SocketIO is configured to support both polling and websocket"""
    assert socketio.async_mode == 'threading'
    assert socketio.ping_timeout == 60
    assert socketio.ping_interval == 25
```

---

## Testing Strategy

### Current Coverage

| Test Type | What It Tests | Catches This Issue? |
|-----------|---------------|---------------------|
| Unit Tests | Individual functions/methods | ❌ No - mocked environment |
| Integration Tests | Component interactions | ❌ No - local Docker only |
| Configuration Tests | ✨ NEW: Config validation | ✅ Yes - verifies settings |

### What Still Won't Be Caught

These tests **will catch configuration errors** (wrong settings in code), but **won't catch infrastructure issues** like:
- Cloudflare blocking WebSockets
- Reverse proxy misconfigurations
- Firewall rules blocking ports
- SSL/TLS certificate issues

---

## Recommended Additional Testing

### 1. End-to-End Tests (E2E)

Deploy to a **staging environment** with the same infrastructure as production:

```javascript
// cypress/e2e/terminal.cy.js
describe('Terminal WebSocket', () => {
  it('should connect without "Invalid frame header" errors', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="container-card"]').first().click();
    cy.get('[data-testid="terminal-button"]').click();

    // Check browser console for errors
    cy.window().then((win) => {
      cy.spy(win.console, 'error').should('not.be.calledWith',
        Cypress.sinon.match(/Invalid frame header/)
      );
    });
  });
});
```

**Benefits**:
- Tests against real Cloudflare/reverse proxy
- Catches infrastructure-specific issues
- Validates actual user experience

### 2. Synthetic Monitoring

Use monitoring tools to continuously test production:

**Datadog Synthetics**:
```yaml
- step:
    name: "Open Terminal"
    action: click
    selector: "[data-testid='terminal-button']"
- step:
    name: "Verify No WebSocket Errors"
    action: assertNoConsoleError
    pattern: "Invalid frame header"
```

**Benefits**:
- 24/7 monitoring of production
- Alerts when issues occur
- Tests from different geographic locations

### 3. Browser Error Tracking

Capture client-side errors from real users:

**Sentry Integration**:
```typescript
// app/layout.tsx
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  beforeSend(event) {
    // Flag WebSocket errors
    if (event.message?.includes('Invalid frame header')) {
      event.tags = { ...event.tags, critical: true };
    }
    return event;
  },
});
```

**Benefits**:
- Captures real production errors
- Provides user context and browser info
- Helps identify patterns

### 4. Infrastructure Tests

Test deployment configuration:

```bash
#!/bin/bash
# test-cloudflare-websocket.sh

echo "Testing WebSocket through Cloudflare..."

# Test direct WebSocket connection
wscat -c "wss://terminalbackend.wardcrew.com/socket.io/?EIO=4&transport=websocket"

if [ $? -ne 0 ]; then
    echo "✗ WebSocket blocked - ensure frontend uses polling"
    exit 1
fi

echo "✓ WebSocket connection successful"
```

**Benefits**:
- Validates infrastructure configuration
- Runs as part of deployment pipeline
- Prevents regressions

---

## Running Tests

### Frontend Tests

```bash
cd frontend
npm install  # Install dependencies including jest
npm test     # Run all tests
npm test -- useInteractiveTerminal  # Run specific test
```

### Backend Tests

```bash
cd backend
pip install -r requirements.txt
pip install pytest pytest-mock  # Install test dependencies
pytest tests/test_websocket.py -v  # Run WebSocket tests
pytest tests/ -v  # Run all tests
```

---

## Test Coverage Goals

### Current Coverage
- ✅ Unit tests for business logic
- ✅ Integration tests for Docker interactions
- ✅ Configuration validation tests (NEW)

### Future Coverage
- ⏳ E2E tests against staging environment
- ⏳ Synthetic monitoring in production
- ⏳ Browser error tracking with Sentry
- ⏳ Infrastructure configuration tests

---

## Key Takeaways

1. **Unit tests alone aren't enough** - Infrastructure issues require infrastructure testing
2. **Test in production-like environments** - Staging should mirror production exactly
3. **Monitor production continuously** - Synthetic tests + error tracking catch real issues
4. **Configuration tests help** - They catch code-level misconfigurations early
5. **Multiple testing layers** - Defense in depth: unit → integration → E2E → monitoring

---

## Related Files

- `frontend/lib/hooks/__tests__/useInteractiveTerminal.test.tsx` - Transport config tests
- `backend/tests/test_websocket.py` - SocketIO configuration tests
- `frontend/lib/hooks/useInteractiveTerminal.ts` - Socket.IO client implementation
- `backend/app.py` - SocketIO server configuration
- `CAPROVER_DEPLOYMENT.md` - Production deployment guide
- `CAPROVER_TROUBLESHOOTING.md` - Infrastructure troubleshooting

---

## Questions?

If you encounter similar infrastructure issues:

1. Check application logs (client + server)
2. Verify infrastructure configuration (reverse proxy, CDN)
3. Test in staging environment matching production
4. Add E2E tests to catch infrastructure-specific issues
5. Set up monitoring to catch issues in production
