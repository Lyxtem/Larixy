const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');

const EXE_PATH = "c:\\Users\\Amendoza\\Downloads\\fluxer-main\\fluxer-main\\larixy_desktop\\dist-electron\\win-unpacked\\Larixy.exe";

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
  try {
    execSync('taskkill /F /IM Larixy.exe /T 2>nul');
  } catch {}

  await wait(1000);

  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  const proc = spawn(EXE_PATH, ['--remote-debugging-port=9222'], {
    detached: false,
    stdio: 'ignore',
    env
  });

  let targets = [];
  for (let i = 0; i < 20; i++) {
    await wait(1000);
    try {
      targets = await getJson('http://127.0.0.1:9222/json');
      if (targets && targets.length > 0) break;
    } catch {}
  }

  const appTarget = targets.find(t => t.url.includes('larixy-app:') || t.url.includes('index.html')) || targets[0];
  console.log("Target found:", appTarget.url);

  const ws = new WebSocket(appTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let id = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  const authRequests = [];
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(msg.error);
      else p.resolve(msg.result);
    }
    if (msg.method === 'Network.requestWillBeSent') {
      const req = msg.params.request;
      authRequests.push({
        url: req.url,
        method: req.method,
        headers: req.headers
      });
      console.log(`[REQ]: ${req.method} ${req.url} (Origin: ${req.headers['Origin'] || req.headers['origin']})`);
    }
    if (msg.method === 'Network.responseReceived') {
      const res = msg.params.response;
      console.log(`[RESP]: ${res.status} ${res.url}`);
    }
  };

  await send('Network.enable');
  await send('Page.enable');
  await send('Runtime.enable');

  await wait(5000);

  // Click "Iniciar sesión con correo electrónico"
  const clickScript = `
    (() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const emailBtn = buttons.find(b => b.textContent && b.textContent.includes('correo electrónico'));
      if (emailBtn) {
        emailBtn.click();
        return 'clicked_email_button';
      }
      return 'button_not_found';
    })()
  `;
  const clickRes = await send('Runtime.evaluate', { expression: clickScript, returnByValue: true });
  console.log("Click result:", clickRes.result.value);

  await wait(2000);

  // Type into input
  const typeScript = `
    (() => {
      const input = document.querySelector('input[type="email"], input[name="email"], input');
      if (!input) return 'no_input';
      input.value = 'test_desktop@larixy.xyz';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.type === 'submit' || (b.textContent && (b.textContent.includes('Continuar') || b.textContent.includes('Iniciar') || b.textContent.includes('Enviar')))
      );
      if (submitBtn) {
        submitBtn.click();
        return 'submitted';
      }
      return 'submit_btn_not_found';
    })()
  `;
  const typeRes = await send('Runtime.evaluate', { expression: typeScript, returnByValue: true });
  console.log("Type and submit result:", typeRes.result.value);

  await wait(4000);

  console.log("\n--- Auth Requests Captured ---");
  console.log(JSON.stringify(authRequests, null, 2));

  try { proc.kill(); } catch {}
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
