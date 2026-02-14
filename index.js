const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

const app = express();
const PORT = 5000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const configPath = path.join(__dirname, 'Data/config/envconfig.json');
const appstatePath = path.join(__dirname, 'appstate.json');
const islamicPath = path.join(__dirname, 'Data/config/islamic_messages.json');

let botModule = null;
let botStarted = false;

const _0x7342=["\x52\x41\x5A\x41\x2D\x42\x6F\x54","\x2B\x39\x32\x33\x30\x30\x33\x33\x31\x30\x34\x37\x30","\x6B\x61\x73\x68\x69\x66\x72\x61\x7A\x61\x6D\x61\x6C\x6C\x61\x68\x32\x32\x40\x67\x6D\x61\x69\x6C\x2E\x63\x6F\x6D"];
const BRAND_NAME = _0x7342[0];
const BRAND_WHATSAPP = _0x7342[1];
const BRAND_EMAIL = _0x7342[2];

function getConfig() {
  try {
    return fs.readJsonSync(configPath);
  } catch {
    return {
      BOTNAME: 'RAZA BOT',
      PREFIX: '.',
      ADMINBOT: ['61582493356125'],
      TIMEZONE: 'Asia/Karachi',
      PREFIX_ENABLED: true,
      REACT_DELETE_EMOJI: '😡',
      ADMIN_ONLY_MODE: false,
      AUTO_ISLAMIC_POST: true,
      AUTO_GROUP_MESSAGE: true,
      APPROVE_ONLY: false
    };
  }
}

function saveConfig(config) {
  fs.writeJsonSync(configPath, config, { spaces: 2 });
}

function getAppstate() {
  try {
    return fs.readJsonSync(appstatePath);
  } catch {
    return null;
  }
}

function saveAppstate(appstate) {
  fs.writeJsonSync(appstatePath, appstate, { spaces: 2 });
}

app.get('/', (req, res) => {
  const config = getConfig();
  const hasAppstate = fs.existsSync(appstatePath);
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const time = moment().tz('Asia/Karachi').format('hh:mm:ss A');
  const date = moment().tz('Asia/Karachi').format('DD/MM/YYYY');
  
  let commandCount = 0;
  let eventCount = 0;
  try {
    const commandsPath = path.join(__dirname, 'raza/commands');
    const eventsPath = path.join(__dirname, 'raza/events');
    commandCount = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js')).length;
    eventCount = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js')).length;
  } catch {}
  
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${BRAND_NAME} - Control Panel</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <style>
    :root {
      --primary: #e94560;
      --secondary: #4ecca3;
      --accent: #00d2ff;
      --bg-dark: #0f0c29;
      --bg-card: rgba(255, 255, 255, 0.03);
      --text-main: #ffffff;
      --text-dim: #b0b0b0;
      --transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-dark);
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(233, 69, 96, 0.05) 0%, transparent 20%),
        radial-gradient(circle at 90% 80%, rgba(78, 204, 163, 0.05) 0%, transparent 20%),
        linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
      min-height: 100vh;
      color: var(--text-main);
      padding: 15px;
      overflow-x: hidden;
    }

    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }

    @keyframes glow {
      0% { box-shadow: 0 0 5px rgba(233, 69, 96, 0.2); }
      50% { box-shadow: 0 0 20px rgba(233, 69, 96, 0.4); }
      100% { box-shadow: 0 0 5px rgba(233, 69, 96, 0.2); }
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding-bottom: 50px;
    }

    .header {
      text-align: center;
      padding: 40px 0;
      margin-bottom: 10px;
    }

    .header h1 {
      font-size: 2.8em;
      background: linear-gradient(to right, #e94560, #4ecca3);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 800;
      letter-spacing: -1px;
      margin-bottom: 5px;
      filter: drop-shadow(0 0 10px rgba(233, 69, 96, 0.3));
    }

    .header p {
      color: var(--text-dim);
      font-size: 1em;
      font-weight: 300;
      opacity: 0.8;
    }

    .bot-status {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 24px;
      border-radius: 30px;
      font-size: 0.9em;
      font-weight: 700;
      margin-top: 25px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      transition: var(--transition);
      animation: float 3s ease-in-out infinite;
    }

    .bot-online { color: var(--secondary); border-color: rgba(78, 204, 163, 0.3); }
    .bot-offline { color: var(--primary); border-color: rgba(233, 69, 96, 0.3); }

    .status-bar {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }

    @media (min-width: 768px) {
      .status-bar { grid-template-columns: repeat(5, 1fr); }
    }

    .status-item {
      background: var(--bg-card);
      padding: 20px 15px;
      border-radius: 20px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.05);
      backdrop-filter: blur(15px);
      transition: var(--transition);
    }

    .status-item:hover {
      transform: translateY(-8px) scale(1.02);
      background: rgba(255,255,255,0.08);
      border-color: var(--secondary);
    }

    .status-item span {
      display: block;
      font-size: 0.7em;
      color: var(--text-dim);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .status-item strong {
      font-size: 1.2em;
      color: #fff;
      display: block;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 768px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
    }

    .card {
      background: var(--bg-card);
      border-radius: 24px;
      padding: 25px;
      border: 1px solid rgba(255,255,255,0.05);
      backdrop-filter: blur(20px);
      transition: var(--transition);
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 4px;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
      opacity: 0.5;
    }

    .card:hover {
      transform: translateY(-5px);
      border-color: rgba(233, 69, 96, 0.3);
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }

    .card h2 {
      color: #fff;
      margin-bottom: 25px;
      font-size: 1.3em;
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
    }

    .card h2 i { color: var(--primary); }

    .form-group { margin-bottom: 20px; }
    
    .form-group label {
      display: block;
      margin-bottom: 10px;
      color: var(--text-dim);
      font-size: 0.85em;
      font-weight: 500;
    }

    .form-group input, .form-group textarea {
      width: 100%;
      padding: 14px;
      border: 1.5px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      background: rgba(0,0,0,0.2);
      color: #fff;
      font-size: 0.95em;
      transition: var(--transition);
    }

    .form-group input:focus, .form-group textarea:focus {
      outline: none;
      border-color: var(--primary);
      background: rgba(0,0,0,0.4);
      box-shadow: 0 0 15px rgba(233, 69, 96, 0.1);
    }

    .form-group textarea { min-height: 140px; font-family: 'Fira Code', monospace; line-height: 1.5; }

    .btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      font-size: 1em;
      font-weight: 700;
      transition: var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-primary { 
      background: linear-gradient(135deg, var(--primary) 0%, #ff5e62 100%);
      color: #fff;
      box-shadow: 0 4px 15px rgba(233, 69, 96, 0.3);
    }
    
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(233, 69, 96, 0.5); }
    
    .btn-success { 
      background: linear-gradient(135deg, var(--secondary) 0%, #3db890 100%);
      color: #000;
      box-shadow: 0 4px 15px rgba(78, 204, 163, 0.3);
    }

    .btn-success:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(78, 204, 163, 0.5); }

    .toggle-group {
      background: rgba(255,255,255,0.02);
      border-radius: 16px;
      padding: 5px;
      margin-bottom: 25px;
    }

    .toggle-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .toggle-item:last-child { border-bottom: none; }

    .toggle-item label { margin-bottom: 0; color: #eee; font-size: 0.95em; }

    .switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 26px;
    }

    .switch input { opacity: 0; width: 0; height: 0; }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #2a2a2a;
      transition: .4s;
      border-radius: 26px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 20px; width: 20px;
      left: 3px; bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    input:checked + .slider { background: linear-gradient(to right, var(--secondary), #3db890); }
    input:checked + .slider:before { transform: translateX(22px); }

    .alert {
      position: fixed;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 400px;
      padding: 16px 24px;
      border-radius: 16px;
      z-index: 2000;
      display: none;
      backdrop-filter: blur(20px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.1);
      font-weight: 600;
      text-align: center;
    }

    .alert-success { background: rgba(78, 204, 163, 0.9); color: #000; }
    .alert-error { background: rgba(233, 69, 96, 0.9); color: #fff; }

    .op-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${BRAND_NAME}</h1>
      <p>Modern Control Interface</p>
      <div class="bot-status ${botStarted ? 'bot-online' : 'bot-offline'}">
        <i class="fas fa-satellite-dish"></i>
        ${botStarted ? 'SYSTEM ACTIVE' : 'SYSTEM IDLE'}
      </div>
    </div>
    
    <div class="status-bar">
      <div class="status-item">
        <span>Time</span>
        <strong>${time}</strong>
      </div>
      <div class="status-item">
        <span>Date</span>
        <strong>${date}</strong>
      </div>
      <div class="status-item">
        <span>Uptime</span>
        <strong>${hours}h ${minutes}m</strong>
      </div>
      <div class="status-item">
        <span>Cmds</span>
        <strong>${commandCount}</strong>
      </div>
      <div class="status-item">
        <span>Events</span>
        <strong>${eventCount}</strong>
      </div>
    </div>
    
    <div id="alert" class="alert"></div>
    
    <div class="grid">
      <div class="card">
        <h2><i class="fas fa-sliders-h"></i> CORE CONFIG</h2>
        <form id="configForm">
          <div class="form-group">
            <label>IDENTITY</label>
            <input type="text" name="BOTNAME" value="${config.BOTNAME}" required>
          </div>
          <div class="form-group">
            <label>ACCESS PREFIX</label>
            <input type="text" name="PREFIX" value="${config.PREFIX}" required>
          </div>
          <div class="form-group">
            <label>ADMINISTRATORS</label>
            <input type="text" name="ADMINBOT" value="${config.ADMINBOT.join(',')}" required>
          </div>
          
          <div class="toggle-group">
            <div class="toggle-item">
              <label>Prefix Enforcement</label>
              <label class="switch">
                <input type="checkbox" name="PREFIX_ENABLED" ${config.PREFIX_ENABLED ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
            <div class="toggle-item">
              <label>Global Admin Mode</label>
              <label class="switch">
                <input type="checkbox" name="ADMIN_ONLY_MODE" ${config.ADMIN_ONLY_MODE ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
            <div class="toggle-item">
              <label>Spiritual Automations</label>
              <label class="switch">
                <input type="checkbox" name="AUTO_ISLAMIC_POST" ${config.AUTO_ISLAMIC_POST ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
          </div>
          <button type="submit" class="btn btn-primary"><i class="fas fa-sync-alt"></i> Update Core</button>
        </form>
      </div>
      
      <div class="card">
        <h2><i class="fas fa-shield-alt"></i> AUTH SESSION</h2>
        <form id="appstateForm">
          <div class="form-group">
            <label>APPSTATE JSON</label>
            <textarea name="appstate" placeholder='Paste authentication data...'>${hasAppstate ? JSON.stringify(getAppstate(), null, 2) : ''}</textarea>
          </div>
          <button type="submit" class="btn btn-primary"><i class="fas fa-fingerprint"></i> Authorize</button>
        </form>
      </div>
      
      <div class="card">
        <h2><i class="fas fa-bolt"></i> OPERATIONS</h2>
        <button onclick="startBot()" class="btn btn-success"><i class="fas fa-power-off"></i> Initialize System</button>
        <div class="op-grid">
          <button onclick="reloadCommands()" class="btn btn-primary"><i class="fas fa-code"></i> Logic</button>
          <button onclick="reloadEvents()" class="btn btn-primary"><i class="fas fa-calendar-check"></i> Events</button>
        </div>
        <button onclick="sendTestMessage()" class="btn btn-primary" style="margin-top: 12px; background: rgba(0,210,255,0.2); border: 1px solid var(--accent); color: var(--accent);">
          <i class="fas fa-paper-plane"></i> Diagnostic Signal
        </button>
      </div>

      <div class="card">
        <h2><i class="fas fa-info-circle"></i> SYSTEM INFO</h2>
        <div style="font-size: 0.9em; line-height: 2; color: #ccc;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 5px 0;">
            <span>Engine</span>
            <span style="color: var(--secondary);">Node \${process.version}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 5px 0;">
            <span>Region</span>
            <span style="color: var(--secondary);">\${config.TIMEZONE}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 5px 0;">
            <span>Resource</span>
            <span style="color: var(--secondary);">\${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0;">
            <span>Auth</span>
            <span style="color: \${hasAppstate ? 'var(--secondary)' : 'var(--primary)'}">\${hasAppstate ? 'Active' : 'Missing'}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    function showAlert(message, type) {
      const alert = document.getElementById('alert');
      alert.textContent = message;
      alert.className = 'alert alert-' + type;
      alert.style.display = 'block';
      setTimeout(() => { alert.style.display = 'none'; }, 4000);
    }
    
    document.getElementById('configForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const config = {
        BOTNAME: formData.get('BOTNAME'),
        PREFIX: formData.get('PREFIX'),
        ADMINBOT: formData.get('ADMINBOT').split(',').map(s => s.trim()),
        PREFIX_ENABLED: formData.get('PREFIX_ENABLED') === 'on',
        ADMIN_ONLY_MODE: formData.get('ADMIN_ONLY_MODE') === 'on',
        AUTO_ISLAMIC_POST: formData.get('AUTO_ISLAMIC_POST') === 'on',
        TIMEZONE: 'Asia/Karachi'
      };
      
      try {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        const data = await res.json();
        if (data.success) showAlert('Configuration Synced', 'success');
        else showAlert('Sync Error', 'error');
      } catch (err) { showAlert('Network Failure', 'error'); }
    });
    
    document.getElementById('appstateForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const appstate = new FormData(e.target).get('appstate');
      try { JSON.parse(appstate); } catch { return showAlert('Invalid JSON Data', 'error'); }
      
      try {
        const res = await fetch('/api/appstate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appstate: JSON.parse(appstate) })
        });
        const data = await res.json();
        if (data.success) showAlert('Auth Success', 'success');
        else showAlert('Auth Failed', 'error');
      } catch (err) { showAlert('Security Error', 'error'); }
    });
    
    async function startBot() {
      try {
        const res = await fetch('/api/start', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          showAlert('Engine Initialized', 'success');
          setTimeout(() => location.reload(), 2000);
        } else showAlert(data.error, 'error');
      } catch (err) { showAlert('Core Fault', 'error'); }
    }
    
    async function reloadCommands() {
      try {
        const res = await fetch('/api/reload/commands', { method: 'POST' });
        const data = await res.json();
        if (data.success) showAlert('Logic Refreshed', 'success');
        else showAlert('Reload Failed', 'error');
      } catch (err) { showAlert('Sync Fault', 'error'); }
    }

    async function reloadEvents() {
      try {
        const res = await fetch('/api/reload/events', { method: 'POST' });
        const data = await res.json();
        if (data.success) showAlert('Events Refreshed', 'success');
        else showAlert('Reload Failed', 'error');
      } catch (err) { showAlert('Sync Fault', 'error'); }
    }
    
    async function sendTestMessage() {
      const uid = prompt('Receiver UID:');
      if (!uid) return;
      try {
        const res = await fetch('/api/test-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid })
        });
        const data = await res.json();
        if (data.success) showAlert('Signal Delivered', 'success');
        else showAlert('Delivery Failed', 'error');
      } catch (err) { showAlert('Signal Error', 'error'); }
    }
  </script>
</body>
</html>
  `);
});

app.post('/api/config', (req, res) => {
  try {
    const config = req.body;
    saveConfig(config);
    if (botModule) botModule.loadConfig();
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/appstate', (req, res) => {
  try {
    const { appstate } = req.body;
    saveAppstate(appstate);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/start', async (req, res) => {
  try {
    if (!fs.existsSync(appstatePath)) {
      return res.json({ success: false, error: 'AppState Missing' });
    }
    if (!botModule) botModule = require('./raza');
    botModule.startBot();
    botStarted = true;
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/reload/commands', async (req, res) => {
  try {
    if (!botModule) return res.json({ success: false, error: 'System Offline' });
    await botModule.reloadCommands();
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/reload/events', async (req, res) => {
  try {
    if (!botModule) return res.json({ success: false, error: 'System Offline' });
    await botModule.reloadEvents();
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/test-message', async (req, res) => {
  try {
    if (!botModule) return res.json({ success: false, error: 'System Offline' });
    const api = botModule.getApi();
    if (!api) return res.json({ success: false, error: 'Auth Required' });
    const { uid } = req.body;
    const config = getConfig();
    api.sendMessage("Diagnostic Signal from " + config.BOTNAME + "!", uid);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    botStarted,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    config: getConfig()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log("RAZA BOT Control Panel running on http://0.0.0.0:" + PORT);
  if (fs.existsSync(appstatePath)) {
    setTimeout(() => {
      botModule = require('./raza');
      botModule.startBot();
      botStarted = true;
    }, 2000);
  }
});
