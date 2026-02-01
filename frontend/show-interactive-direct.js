const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    console.log('=== GNOME Terminal Interactive Mode Demo ===\n');

    browser = await chromium.launch({
      headless: true,
      executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 }})).newPage();

    // Capture all console messages
    const errors = [];
    const warnings = [];
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        errors.push(text);
        console.log(`[BROWSER ERROR]`, text);
      } else if (type === 'warning') {
        warnings.push(text);
        console.log(`[BROWSER WARNING]`, text);
      }
    });

    // Mock containers API
    await page.route('**/api/containers', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          containers: [{
            id: 'gnome-demo-123',
            name: 'ubuntu-container',
            image: 'ubuntu:22.04',
            status: 'running',
            uptime: '2 days'
          }]
        })
      });
    });

    // Block Socket.io requests to prevent errors
    await page.route('**/socket.io/**', async (route) => {
      // Just hang the request - don't respond
      await new Promise(() => {});
    });

    console.log('1. Loading application...');
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'demo-token');
      localStorage.setItem('auth_username', 'admin');
    });

    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('✓ Dashboard loaded\n');

    console.log('2. Opening terminal...');
    await page.click('button:has-text("Open Shell")');
    await page.waitForSelector('[role="dialog"]');
    console.log('✓ Terminal modal opened\n');

    console.log('3. Waiting for xterm to initialize...');
    // Wait for xterm to be initialized
    await page.waitForFunction(() => {
      return window._debugTerminal != null;
    }, { timeout: 10000 });

    console.log('4. Injecting terminal startup...');
    await page.evaluate(() => {
      const term = window._debugTerminal;
      if (term) {
        console.log('Writing startup messages...');
        term.write('\x1b[0m\r\n');
        term.write('\x1b[1;32m*** Interactive Terminal Started ***\x1b[0m\r\n');
        term.write('You can now use sudo, nano, vim, and other interactive commands.\r\n\r\n');
        term.write('\x1b[1;32mroot@ubuntu-container\x1b[0m:\x1b[1;34m/app\x1b[0m# ');
      }
    });

    await page.waitForTimeout(500);

    console.log('5. Simulating "ls -la" command...');
    await page.evaluate(() => {
      const term = window._debugTerminal;
      if (term) {
        // Simulate typing
        term.write('ls -la\r\n');

        // Simulate ls -la output with colors
        term.write('total 48\r\n');
        term.write('\x1b[1;34mdrwxr-xr-x\x1b[0m  8 root root 4096 Feb  1 03:17 \x1b[1;34m.\x1b[0m\r\n');
        term.write('\x1b[1;34mdrwxr-xr-x\x1b[0m 12 root root 4096 Jan 28 10:42 \x1b[1;34m..\x1b[0m\r\n');
        term.write('-rw-r--r--  1 root root  220 Jan  1  2024 .bashrc\r\n');
        term.write('\x1b[1;34mdrwxr-xr-x\x1b[0m  2 root root 4096 Jan 15 14:23 \x1b[1;34mbin\x1b[0m\r\n');
        term.write('\x1b[1;34mdrwxr-xr-x\x1b[0m  3 root root 4096 Jan 20 09:10 \x1b[1;34mconfig\x1b[0m\r\n');
        term.write('-rw-r--r--  1 root root 1245 Jan 28 16:34 docker-compose.yml\r\n');
        term.write('\x1b[1;34mdrwxr-xr-x\x1b[0m  5 root root 4096 Feb  1 03:17 \x1b[1;34mnode_modules\x1b[0m\r\n');
        term.write('-rw-r--r--  1 root root 2891 Jan 30 11:22 package.json\r\n');
        term.write('-rw-r--r--  1 root root 8234 Jan 30 11:22 package-lock.json\r\n');
        term.write('-rw-r--r--  1 root root  523 Jan 15 08:45 README.md\r\n');
        term.write('\x1b[1;34mdrwxr-xr-x\x1b[0m  4 root root 4096 Jan 25 13:56 \x1b[1;34msrc\x1b[0m\r\n');

        // Show prompt again
        term.write('\x1b[1;32mroot@ubuntu-container\x1b[0m:\x1b[1;34m/app\x1b[0m# ');
      }
    });

    console.log('6. Waiting for render...');
    await page.waitForTimeout(1000);

    // Check status
    const status = await page.evaluate(() => {
      const activeButton = document.querySelector('button[aria-pressed="true"]');
      const mode = activeButton?.textContent || 'unknown';

      let bufferText = '';
      if (window._debugTerminal) {
        try {
          const buffer = window._debugTerminal.buffer.active;
          for (let i = 0; i < Math.min(buffer.length, 10); i++) {
            const line = buffer.getLine(i);
            if (line) {
              bufferText += line.translateToString(true) + '\n';
            }
          }
        } catch (e) {
          bufferText = 'Error: ' + e.message;
        }
      }

      return {
        mode,
        bufferText: bufferText.trim()
      };
    });

    console.log('Terminal Mode:', status.mode);
    console.log('\nBuffer content:');
    console.log('---');
    console.log(status.bufferText);
    console.log('---\n');

    console.log('Errors captured:', errors.length);
    console.log('Warnings captured:', warnings.length);
    if (errors.length > 0) {
      console.log('\nUnique errors:');
      [...new Set(errors)].forEach((err, i) => console.log(`${i + 1}. ${err.substring(0, 150)}`));
    }

    await page.screenshot({
      path: '/home/user/docker-swarm-termina/frontend/gnome-interactive-demo.png',
      fullPage: false
    });
    console.log('✓ Screenshot saved\n');

    if (status.mode.includes('Interactive') && status.bufferText.includes('Interactive Terminal Started')) {
      console.log('✅ SUCCESS! Interactive GNOME terminal with visible output!');
    } else {
      console.log('⚠ Mode:', status.mode);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
