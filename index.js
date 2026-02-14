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
      --bg-dark: #1a1a2e;
      --bg-card: rgba(255, 255, 255, 0.05);
      --text-main: #ffffff;
      --text-dim: #aaaaaa;
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
      min-height: 100vh;
      color: var(--text-main);
      padding: 15px;
      overflow-x: hidden;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      animation: fadeIn 0.8s ease-out;
    }

    .header {
      text-align: center;
      padding: 20px 0;
      margin-bottom: 20px;
      position: relative;
    }

    .header h1 {
      font-size: 2.2em;
      color: var(--primary);
      text-shadow: 0 0 15px rgba(233, 69, 96, 0.4);
      letter-spacing: 2px;
      margin-bottom: 10px;
    }

    .header p {
      color: var(--text-dim);
      font-size: 0.9em;
    }

    .bot-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 25px;
      font-size: 0.85em;
      font-weight: 600;
      margin-top: 15px;
      background: var(--bg-card);
      border: 1px solid rgba(255,255,255,0.1);
      transition: var(--transition);
    }

    .bot-online { color: var(--secondary); box-shadow: 0 0 10px rgba(78, 204, 163, 0.2); }
    .bot-offline { color: var(--primary); box-shadow: 0 0 10px rgba(233, 69, 96, 0.2); }

    .status-bar {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 25px;
    }

    @media (min-width: 768px) {
      .status-bar { grid-template-columns: repeat(5, 1fr); }
    }

    .status-item {
      background: var(--bg-card);
      padding: 15px;
      border-radius: 12px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.05);
      backdrop-filter: blur(5px);
      transition: var(--transition);
    }

    .status-item:hover {
      transform: translateY(-5px);
      background: rgba(255,255,255,0.08);
      border-color: var(--primary);
    }

    .status-item span {
      display: block;
      font-size: 0.75em;
      color: var(--text-dim);
      margin-bottom: 5px;
      text-transform: uppercase;
    }

    .status-item strong {
      font-size: 1.1em;
      color: var(--secondary);
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 15px;
    }

    @media (min-width: 992px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
    }

    .card {
      background: var(--bg-card);
      border-radius: 18px;
      padding: 20px;
      border: 1px solid rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      transition: var(--transition);
      animation: fadeIn 0.5s ease-out forwards;
      opacity: 0;
    }

    .card:nth-child(1) { animation-delay: 0.1s; }
    .card:nth-child(2) { animation-delay: 0.2s; }
    .card:nth-child(3) { animation-delay: 0.3s; }
    .card:nth-child(4) { animation-delay: 0.4s; }

    .card:hover {
      border-color: rgba(233, 69, 96, 0.3);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .card h2 {
      color: var(--primary);
      margin-bottom: 18px;
      font-size: 1.2em;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .form-group { margin-bottom: 15px; }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: var(--text-dim);
      font-size: 0.85em;
    }

    .form-group input, .form-group textarea, .form-group select {
      width: 100%;
      padding: 12px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      background: rgba(0,0,0,0.2);
      color: #fff;
      font-size: 0.95em;
      transition: var(--transition);
    }

    .form-group input:focus, .form-group textarea:focus {
      outline: none;
      border-color: var(--primary);
      background: rgba(0,0,0,0.4);
    }

    .form-group textarea { min-height: 120px; font-family: monospace; }

    .btn {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.95em;
      font-weight: 600;
      transition: var(--transition);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:active { transform: scale(0.98); }
    
    .btn-success { background: var(--secondary); color: #000; }
    .btn-success:active { transform: scale(0.98); }

    .toggle-group {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }

    .toggle-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
    }

    .toggle-item label { margin-bottom: 0; color: #fff; font-size: 0.9em; }

    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }

    .switch input { opacity: 0; width: 0; height: 0; }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #333;
      transition: .4s;
      border-radius: 24px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px; width: 18px;
      left: 3px; bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

    input:checked + .slider { background-color: var(--secondary); }
    input:checked + .slider:before { transform: translateX(20px); }

    .alert {
      position: fixed;
      top: 20px;
      right: 20px;
      left: 20px;
      padding: 15px 20px;
      border-radius: 12px;
      z-index: 1000;
      display: none;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 5px 20px rgba(0,0,0,0.4);
    }

    @keyframes slideIn {
      from { transform: translateY(-100px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .alert-success { background: #4ecca3; color: #000; }
    .alert-error { background: #e94560; color: #fff; }

    .quick-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${BRAND_NAME}</h1>
      <p>Messenger Bot Elite Panel</p>
      <div class="bot-status ${botStarted ? 'bot-online' : 'bot-offline'}">
        <i class="fas fa-circle"></i>
        ${botStarted ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
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
        <h2><i class="fas fa-robot"></i> Instance Manager</h2>
        <div class="form-group">
          <label>New Bot Identity</label>
          <input type="text" id="instanceName" placeholder="Enter Bot Name...">
        </div>
        <div class="quick-actions">
          <button onclick="createInstance()" class="btn btn-success"><i class="fas fa-plus"></i> Create</button>
          <button onclick="deleteInstance()" class="btn btn-primary"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>

      <div class="card">
        <h2><i class="fas fa-cog"></i> Configuration</h2>
        <form id="configForm">
          <div class="form-group">
            <label>Bot Display Name</label>
            <input type="text" name="BOTNAME" value="${config.BOTNAME}" required>
          </div>
          <div class="form-group">
            <label>Command Prefix</label>
            <input type="text" name="PREFIX" value="${config.PREFIX}" required>
          </div>
          <div class="form-group">
            <label>Master Admin UIDs</label>
            <input type="text" name="ADMINBOT" value="${config.ADMINBOT.join(',')}" required>
          </div>
          
          <div class="toggle-group">
            <div class="toggle-item">
              <label>Prefix Logic</label>
              <label class="switch">
                <input type="checkbox" name="PREFIX_ENABLED" ${config.PREFIX_ENABLED ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
            <div class="toggle-item">
              <label>Admin Only Mode</label>
              <label class="switch">
                <input type="checkbox" name="ADMIN_ONLY_MODE" ${config.ADMIN_ONLY_MODE ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
            <div class="toggle-item">
              <label>Islamic Automations</label>
              <label class="switch">
                <input type="checkbox" name="AUTO_ISLAMIC_POST" ${config.AUTO_ISLAMIC_POST ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
          </div>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Changes</button>
        </form>
      </div>
      
      <div class="card">
        <h2><i class="fas fa-key"></i> Session Data</h2>
        <form id="appstateForm">
          <div class="form-group">
            <label>Paste Facebook AppState JSON</label>
            <textarea name="appstate" placeholder='Paste JSON cookies here...'>${hasAppstate ? JSON.stringify(getAppstate(), null, 2) : ''}</textarea>
          </div>
          <button type="submit" class="btn btn-primary"><i class="fas fa-unlock-alt"></i> Update Session</button>
        </form>
      </div>
      
      <div class="card">
        <h2><i class="fas fa-terminal"></i> Bot Operations</h2>
        <button onclick="startBot()" class="btn btn-success"><i class="fas fa-play"></i> Launch Bot</button>
        <div class="quick-actions">
          <button onclick="reloadCommands()" class="btn btn-primary"><i class="fas fa-sync"></i> Cmds</button>
          <button onclick="reloadEvents()" class="btn btn-primary"><i class="fas fa-redo"></i> Events</button>
        </div>
        <button onclick="sendTestMessage()" class="btn btn-primary" style="margin-top: 10px; background: #302b63;">
          <i class="fas fa-paper-plane"></i> Send Signal Test
        </button>
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
    
    async function deleteInstance() {
      const name = document.getElementById('instanceName').value;
      if (!name) return showAlert('Identity required!', 'error');
      if (!confirm(\`Destroy \${name} instance?\`)) return;
      
      try {
        const res = await fetch('/api/instance/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.success) showAlert('Instance terminated!', 'success');
        else showAlert(data.error, 'error');
      } catch (err) { showAlert('Execution failed', 'error'); }
    }

    async function createInstance() {
      const name = document.getElementById('instanceName').value;
      if (!name) return showAlert('Identity required!', 'error');
      
      try {
        const res = await fetch('/api/instance/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.success) {
          showAlert('New instance deployed!', 'success');
          setTimeout(() => location.reload(), 1500);
        } else showAlert(data.error, 'error');
      } catch (err) { showAlert('Deployment failed', 'error'); }
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
        if (data.success) showAlert('Config synchronized!', 'success');
        else showAlert('Sync failed', 'error');
      } catch (err) { showAlert('Network error', 'error'); }
    });
    
    document.getElementById('appstateForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const appstate = new FormData(e.target).get('appstate');
      try { JSON.parse(appstate); } catch { return showAlert('Corrupt JSON format', 'error'); }
      
      try {
        const res = await fetch('/api/appstate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appstate: JSON.parse(appstate) })
        });
        const data = await res.json();
        if (data.success) showAlert('Session authorized!', 'success');
        else showAlert('Auth rejected', 'error');
      } catch (err) { showAlert('Security error', 'error'); }
    });
    
    async function startBot() {
      try {
        const res = await fetch('/api/start', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          showAlert('Launching system core...', 'success');
          setTimeout(() => location.reload(), 2000);
        } else showAlert(data.error, 'error');
      } catch (err) { showAlert('Core failure', 'error'); }
    }
    
    async function reloadCommands() {
      try {
        const res = await fetch('/api/reload/commands', { method: 'POST' });
        const data = await res.json();
        if (data.success) showAlert('Logic refreshed!', 'success');
        else showAlert('Refresh failed', 'error');
      } catch (err) { showAlert('Sync failure', 'error'); }
    }

    async function reloadEvents() {
      try {
        const res = await fetch('/api/reload/events', { method: 'POST' });
        const data = await res.json();
        if (data.success) showAlert('Events synchronized!', 'success');
        else showAlert('Sync failed', 'error');
      } catch (err) { showAlert('Sync failure', 'error'); }
    }
    
    async function sendTestMessage() {
      const uid = prompt('Enter Target UID:');
      if (!uid) return;
      try {
        const res = await fetch('/api/test-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid })
        });
        const data = await res.json();
        if (data.success) showAlert('Signal delivered!', 'success');
        else showAlert('Delivery failed', 'error');
      } catch (err) { showAlert('Transmission error', 'error'); }
    }
  </script>
</body>
</html>
  `);
});

app.post('/api/instance/create', (req, res) => {
  try {
    const { name } = req.body;
    const config = getConfig();
    config.BOTNAME = name;
    saveConfig(config);
    
    if (botModule) {
      botModule.loadConfig();
    }
    
    res.json({ success: true, message: "Bot " + name + " created and config updated" });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/instance/delete', (req, res) => {
  try {
    const { name } = req.body;
    const config = getConfig();
    if (config.BOTNAME === name) {
      config.BOTNAME = "RAZA BOT"; // Reset to default
      saveConfig(config);
      if (botModule) botModule.loadConfig();
      res.json({ success: true, message: "Bot " + name + " deleted and config reset" });
    } else {
      res.json({ success: false, error: "Bot instance not found or name mismatch" });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const config = req.body;
    saveConfig(config);
    
    if (botModule) {
      botModule.loadConfig();
    }
    
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
      return res.json({ success: false, error: 'AppState not configured' });
    }
    
    if (!botModule) {
      botModule = require('./raza');
    }
    
    botModule.startBot();
    botStarted = true;
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/reload/commands', async (req, res) => {
  try {
    if (!botModule) {
      return res.json({ success: false, error: 'Bot not started' });
    }
    
    await botModule.reloadCommands();
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/reload/events', async (req, res) => {
  try {
    if (!botModule) {
      return res.json({ success: false, error: 'Bot not started' });
    }
    
    await botModule.reloadEvents();
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/test-message', async (req, res) => {
  try {
    if (!botModule) {
      return res.json({ success: false, error: 'Bot not started' });
    }
    
    const api = botModule.getApi();
    if (!api) {
      return res.json({ success: false, error: 'Bot not logged in' });
    }
    
    const { uid } = req.body;
    const config = getConfig();
    
    api.sendMessage("Test message from " + config.BOTNAME + "!", uid);
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
    console.log('AppState found, starting bot...');
    setTimeout(() => {
      botModule = require('./raza');
      botModule.startBot();
      botStarted = true;
    }, 2000);
  } else {
    console.log('No appstate found. Please configure through web panel.');
  }
});
