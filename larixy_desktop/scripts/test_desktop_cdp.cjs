const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const EXE_PATH = "c:\\Users\\Amendoza\\Downloads\\fluxer-main\\fluxer-main\\larixy_desktop\\dist-electron\\win-unpacked\\Larixy.exe";
const ARTIFACT_DIR = "C:\\Users\\Amendoza\\.gemini\\antigravity\\brain\\8603b235-7ade-476b-8918-d0b5877425b5";
const SCREENSHOT_PATH = path.join(ARTIFACT_DIR, "desktop_verified_screen.png");

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log("Launching Larixy.exe with --remote-debugging-port=9222 ...");
  
  // Clean lingering Larixy instances first
  const { execSync } = require('child_process');
  try {
    execSync('taskkill /F /IM Larixy.exe /T 2>nul');
  } catch {}

  await wait(1000);

  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  const proc = spawn(EXE_PATH, [
    '--remote-debugging-port=9222'
  ], {
    detached: false,
    stdio: 'ignore',
    env
  });

  proc.on('error', (err) => console.error("Proc error:", err));

  let targets = [];
  for (let i = 0; i < 20; i++) {
    await wait(1000);
    try {
      targets = await getJson('http://127.0.0.1:9222/json');
      if (targets && targets.length > 0) {
        console.log(`Connected to CDP! Found ${targets.length} target(s):`);
        targets.forEach(t => console.log(` - [${t.type}] ${t.title} (${t.url})`));
        break;
      }
    } catch (e) {
      // waiting for electron to open port
    }
  }

  if (!targets || targets.length === 0) {
    console.error("FATAL: Could not connect to CDP on port 9222 after 20 attempts.");
    try { proc.kill(); } catch {}
    process.exit(1);
  }

  // Find the app target (larixy-app:// or page)
  let appTarget = targets.find(t => t.url.includes('larixy-app:') || t.url.includes('index.html')) || targets.find(t => t.type === 'page') || targets[0];
  console.log(`Attaching to target: ${appTarget.title} (${appTarget.url})`);

  const ws = new WebSocket(appTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  function send(method, params = {}) {
    const id = msgId++;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve) => {
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
    });
  }

  const consoleMessages = [];
  const exceptions = [];
  const logEntries = [];
  const networkRequests = [];

  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      consoleMessages.push({ type: msg.params.type, text });
      console.log(`[RENDERER CONSOLE ${msg.params.type}]:`, text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
      exceptions.push(desc);
      console.log(`[RENDERER EXCEPTION]:`, desc);
    }
    if (msg.method === 'Log.entryAdded') {
      logEntries.push(msg.params.entry);
      console.log(`[RENDERER LOG ${msg.params.entry.level}]:`, msg.params.entry.text);
    }
    if (msg.method === 'Network.requestWillBeSent') {
      networkRequests.push({
        url: msg.params.request.url,
        method: msg.params.request.method,
        headers: msg.params.request.headers
      });
      console.log(`[NETWORK REQ]: ${msg.params.request.method} ${msg.params.request.url}`);
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Network.enable');

  // Wait 6 seconds for full bootstrap
  console.log("Waiting 6 seconds for app bootstrap and render...");
  await wait(6000);

  // If we are on splash, check if main window opened
  let currentTabs = await getJson('http://127.0.0.1:9222/json');
  console.log(`Current tabs: ${currentTabs.length}`);
  currentTabs.forEach(t => console.log(` - [${t.type}] ${t.title} (${t.url})`));

  // If a new main window appeared, switch to it
  const mainTab = currentTabs.find(t => t.url.includes('larixy-app://app') && !t.url.includes('splash'));
  let activeSend = send;
  let activeWs = ws;

  if (mainTab && mainTab.id !== appTarget.id) {
    console.log(`Switching to main window: ${mainTab.title} (${mainTab.url})`);
    const newWs = new WebSocket(mainTab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      newWs.onopen = resolve;
      newWs.onerror = reject;
    });

    let newMsgId = 1;
    activeSend = function(method, params = {}) {
      const id = newMsgId++;
      newWs.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve) => {
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === id) {
            newWs.removeEventListener('message', handler);
            resolve(msg.result);
          }
        };
        newWs.addEventListener('message', handler);
      });
    };

    newWs.addEventListener('message', (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        consoleMessages.push({ type: msg.params.type, text });
        console.log(`[MAIN RENDERER CONSOLE ${msg.params.type}]:`, text);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
        exceptions.push(desc);
        console.log(`[MAIN RENDERER EXCEPTION]:`, desc);
      }
      if (msg.method === 'Log.entryAdded') {
        logEntries.push(msg.params.entry);
        console.log(`[MAIN RENDERER LOG ${msg.params.entry.level}]:`, msg.params.entry.text);
      }
      if (msg.method === 'Network.requestWillBeSent') {
        networkRequests.push({
          url: msg.params.request.url,
          method: msg.params.request.method,
          headers: msg.params.request.headers
        });
        console.log(`[MAIN NETWORK REQ]: ${msg.params.request.method} ${msg.params.request.url}`);
      }
    });

    await activeSend('Page.enable');
    await activeSend('Runtime.enable');
    await activeSend('Log.enable');
    await activeSend('Network.enable');

    await wait(3000);
  }

  // Capture screenshot
  console.log("Capturing screenshot of active window...");
  const screenshot = await activeSend('Page.captureScreenshot', { format: 'png' });
  if (screenshot && screenshot.data) {
    fs.writeFileSync(SCREENSHOT_PATH, Buffer.from(screenshot.data, 'base64'));
    console.log(`✓ Screenshot successfully saved to: ${SCREENSHOT_PATH}`);
  }

  // Evaluate DOM
  const evalDom = await activeSend('Runtime.evaluate', {
    expression: `({
      title: document.title,
      url: location.href,
      protocol: location.protocol,
      hasRoot: !!document.getElementById('root'),
      rootChildCount: document.getElementById('root')?.children?.length || 0,
      bodyTextSnippet: document.body.innerText.slice(0, 400),
      hasSvg: document.querySelectorAll('svg').length,
      hasEmailInput: !!document.querySelector('input[type="email"], input[name="email"], input[autocomplete="username"], input[autocomplete="email"]')
    })`,
    returnByValue: true
  });
  console.log("DOM State:", JSON.stringify(evalDom.result.value, null, 2));

  // Check for any integrity or ReferenceError errors
  const integrityErrors = exceptions.filter(e => /integrity|digest|sha384|ChunkIntegrity/i.test(e))
    .concat(logEntries.filter(l => /integrity|digest|sha384|ChunkIntegrity/i.test(l.text)).map(l => l.text));
  const refErrors = exceptions.filter(e => /ReferenceError|is not defined/i.test(e))
    .concat(logEntries.filter(l => /ReferenceError|is not defined/i.test(l.text)).map(l => l.text));

  console.log("\n=================== VERIFICATION AUDIT ===================");
  console.log(`Integrity Errors count: ${integrityErrors.length}`);
  if (integrityErrors.length > 0) {
    console.log("Integrity Errors details:", integrityErrors);
  }
  console.log(`ReferenceError ('d is not defined') count: ${refErrors.length}`);
  if (refErrors.length > 0) {
    console.log("ReferenceError details:", refErrors);
  }
  console.log(`Window Title: "${evalDom.result.value.title}"`);
  console.log(`Window URL: ${evalDom.result.value.url}`);
  console.log(`Has Root Element Content: ${evalDom.result.value.hasRoot} (children: ${evalDom.result.value.rootChildCount})`);
  console.log(`Has SVGs (icons/logo): ${evalDom.result.value.hasSvg}`);
  console.log(`Has Email Input: ${evalDom.result.value.hasEmailInput}`);

  // Test email login flow evaluation if input is present
  if (evalDom.result.value.hasEmailInput) {
    console.log("\nTesting email login input interaction...");
    await activeSend('Runtime.evaluate', {
      expression: `(()=>{
        const input = document.querySelector('input[type="email"], input[name="email"], input[autocomplete="username"], input[autocomplete="email"]');
        if (input) {
          input.value = "test@larixy.xyz";
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()`
    });
    console.log("Email typed into input field.");
  }

  // Clean shutdown
  try { activeWs.close(); } catch {}
  try { ws.close(); } catch {}
  try { proc.kill(); } catch {}

  const resultSummary = {
    screenshotPath: SCREENSHOT_PATH,
    dom: evalDom.result.value,
    integrityErrors,
    refErrors,
    totalExceptions: exceptions.length,
    totalLogs: logEntries.length
  };

  fs.writeFileSync(path.join(ARTIFACT_DIR, "desktop_test_result.json"), JSON.stringify(resultSummary, null, 2));
  console.log("Verification finished successfully!");
}

main().catch(err => {
  console.error("Fatal error during verification:", err);
  process.exit(1);
});
