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

let botModule = null;
let botStarted = false;

const BRAND_NAME = "RAZA-BoT";

function getConfig() {
  try {
    return fs.readJsonSync(configPath);
  } catch {
    return {
      BOTNAME: "Muskan",
      PREFIX: ".",
      ADMINBOT: ["100004370672067"],
      PREFIX_ENABLED: true,
      ADMIN_ONLY_MODE: true,
      AUTO_ISLAMIC_POST: true,
      TIMEZONE: "Asia/Karachi"
    };
  }
}

function saveConfig(config) {
  fs.writeJsonSync(configPath, config, { spaces: 2 });
}

function getAppstate() {
  try { return fs.readJsonSync(appstatePath); } catch { return null; }
}

function saveAppstate(appstate) {
  fs.writeJsonSync(appstatePath, appstate, { spaces: 2 });
}

const logHistory = [];
const originalLog = console.log;
console.log = (...args) => {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  logHistory.push(`[${moment().tz('Asia/Karachi').format('hh:mm:ss A')}] ${msg}`);
  if (logHistory.length > 50) logHistory.shift();
  originalLog.apply(console, args);
};

app.get('/', (req, res) => {
  const config = getConfig();
  const hasAppstate = fs.existsSync(appstatePath);
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const time = moment().tz('Asia/Karachi').format('hh:mm A');
  
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${BRAND_NAME}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <style>
    :root {
      --primary: #6366f1;
      --secondary: #10b981;
      --danger: #ef4444;
      --bg: #0f172a;
      --card: #1e293b;
      --text: #f8fafc;
      --text-dim: #94a3b8;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 12px;
    }
    .container { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
    .header { text-align: center; padding: 10px 0; }
    .header h1 { font-size: 1.5rem; font-weight: 800; color: var(--primary); letter-spacing: -0.5px; }
    
    .status-badge {
      display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px;
      border-radius: 20px; font-size: 0.75rem; font-weight: 700; margin-top: 8px;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    }
    .online { color: var(--secondary); border-color: var(--secondary); }
    .offline { color: var(--danger); border-color: var(--danger); }

    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .stat-card { background: var(--card); padding: 10px; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.05); }
    .stat-card span { display: block; font-size: 0.6rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; }
    .stat-card strong { font-size: 0.85rem; color: #fff; }

    .card { background: var(--card); border-radius: 16px; padding: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .card h2 { font-size: 0.9rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; color: var(--text-dim); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .form-group { margin-bottom: 12px; }
    .form-group label { display: block; font-size: 0.7rem; color: var(--text-dim); margin-bottom: 4px; font-weight: 600; }
    .form-group input, .form-group textarea {
      width: 100%; padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
      background: #0f172a; color: #fff; font-size: 0.85rem; transition: 0.2s;
    }
    .form-group input:focus { border-color: var(--primary); outline: none; }

    .switch-group { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #0f172a; border-radius: 10px; margin-bottom: 8px; }
    .switch-group span { font-size: 0.8rem; font-weight: 600; }
    .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #334155; transition: .3s; border-radius: 20px; }
    .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background: #fff; transition: .3s; border-radius: 50%; }
    input:checked + .slider { background: var(--secondary); }
    input:checked + .slider:before { transform: translateX(20px); }

    .btn {
      width: 100%; padding: 10px; border-radius: 10px; cursor: pointer; border: none;
      font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: 0.2s; margin-bottom: 8px;
    }
    .btn:active { transform: scale(0.98); }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-success { background: var(--secondary); color: #fff; }
    .btn-danger { background: var(--danger); color: #fff; }
    .btn-ghost { background: rgba(255,255,255,0.05); color: var(--text); border: 1px solid rgba(255,255,255,0.1); }

    #logBox {
      background: #000; border-radius: 12px; padding: 12px; height: 200px;
      overflow-y: auto; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #10b981;
      border: 1px solid rgba(255,255,255,0.1); line-height: 1.4;
    }
    .log-line { margin-bottom: 2px; }

    .alert {
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      width: 90%; max-width: 320px; padding: 12px; border-radius: 12px; z-index: 1000;
      display: none; text-align: center; font-size: 0.8rem; font-weight: 700;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    .alert-success { background: var(--secondary); color: #fff; }
    .alert-error { background: var(--danger); color: #fff; }

    .controls-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${BRAND_NAME}</h1>
      <div id="statusBadge" class="status-badge ${botStarted ? 'online' : 'offline'}">
        <i class="fas fa-circle"></i>
        <span id="statusText">${botStarted ? 'SYSTEM ACTIVE' : 'SYSTEM IDLE'}</span>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card"><span>Time</span><strong>${time}</strong></div>
      <div class="stat-card"><span>Uptime</span><strong>${hours}h ${minutes}m</strong></div>
      <div class="stat-card"><span>Prefix</span><strong>${config.PREFIX}</strong></div>
    </div>

    <div class="card">
      <h2><i class="fas fa-cog"></i> CONFIGURATION</h2>
      <form id="configForm">
        <div class="form-group">
          <label>BOT NAME</label>
          <input type="text" name="BOTNAME" value="${config.BOTNAME}">
        </div>
        <div class="form-group">
          <label>PREFIX</label>
          <input type="text" name="PREFIX" value="${config.PREFIX}">
        </div>
        <div class="form-group">
          <label>ADMIN UIDs (comma separated)</label>
          <input type="text" name="ADMINBOT" value="${config.ADMINBOT.join(',')}">
        </div>
        
        <div class="switch-group">
          <span>Prefix Enabled</span>
          <label class="switch">
            <input type="checkbox" name="PREFIX_ENABLED" ${config.PREFIX_ENABLED ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        <div class="switch-group">
          <span>Admin Only Mode</span>
          <label class="switch">
            <input type="checkbox" name="ADMIN_ONLY_MODE" ${config.ADMIN_ONLY_MODE ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        <div class="switch-group">
          <span>Islamic Posts</span>
          <label class="switch">
            <input type="checkbox" name="AUTO_ISLAMIC_POST" ${config.AUTO_ISLAMIC_POST ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        
        <button type="submit" class="btn btn-primary">Update Settings</button>
      </form>
    </div>

    <div class="card">
      <h2><i class="fas fa-key"></i> AUTHENTICATION</h2>
      <form id="appstateForm">
        <div class="form-group">
          <textarea id="appstateInput" style="height: 80px;" placeholder='Paste AppState JSON here...'>${hasAppstate ? 'Appstate Loaded' : ''}</textarea>
        </div>
        <button type="submit" class="btn btn-primary">Save & Initialize</button>
      </form>
    </div>

    <div class="card">
      <h2><i class="fas fa-bolt"></i> SYSTEM CONTROLS</h2>
      <button id="startStopBtn" onclick="toggleBot()" class="btn ${botStarted ? 'btn-danger' : 'btn-success'}">
        <i class="fas ${botStarted ? 'fa-stop' : 'fa-play'}"></i>
        ${botStarted ? 'Terminate' : 'Start'}
      </button>
      <div class="controls-grid">
        <button onclick="deleteAppstate()" class="btn btn-ghost"><i class="fas fa-trash"></i> Reset Auth</button>
        <button onclick="clearLogs()" class="btn btn-ghost"><i class="fas fa-eraser"></i> Clear Logs</button>
      </div>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <h2><i class="fas fa-terminal"></i> LIVE CONSOLE</h2>
      <div id="logBox"><div id="logs">Booting...</div></div>
      <button onclick="copyLogs()" class="btn btn-ghost" style="margin-top: 10px;"><i class="fas fa-copy"></i> Copy Output</button>
    </div>

    <div id="alert" class="alert"></div>
  </div>

  <script>
    let isStarted = ${botStarted};
    function showAlert(msg, type) {
      const a = document.getElementById('alert');
      a.textContent = msg; a.className = 'alert alert-' + type;
      a.style.display = 'block'; setTimeout(() => a.style.display='none', 3000);
    }

    async function toggleBot() {
      const endpoint = isStarted ? '/api/stop' : '/api/start';
      try {
        const res = await fetch(endpoint, {method: 'POST'});
        const data = await res.json();
        if(data.success) {
          isStarted = !isStarted; updateUI();
          showAlert(isStarted ? 'System Started' : 'System Terminated', 'success');
        } else showAlert(data.error, 'error');
      } catch(e) { showAlert('Network Error', 'error'); }
    }

    function updateUI() {
      const btn = document.getElementById('startStopBtn');
      const badge = document.getElementById('statusBadge');
      const text = document.getElementById('statusText');
      btn.className = isStarted ? 'btn btn-danger' : 'btn btn-success';
      btn.innerHTML = isStarted ? '<i class="fas fa-stop"></i> Terminate' : '<i class="fas fa-play"></i> Start';
      badge.className = 'status-badge ' + (isStarted ? 'online' : 'offline');
      text.textContent = isStarted ? 'SYSTEM ACTIVE' : 'SYSTEM IDLE';
    }

    async function deleteAppstate() {
      if(!confirm('Reset Auth?')) return;
      fetch('/api/appstate/delete', {method: 'POST'}).then(() => {
        document.getElementById('appstateInput').value = '';
        showAlert('Auth Reset', 'success');
        if(isStarted) toggleBot();
      });
    }

    document.getElementById('configForm').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = {
        BOTNAME: fd.get('BOTNAME'),
        PREFIX: fd.get('PREFIX'),
        ADMINBOT: fd.get('ADMINBOT').split(',').map(s => s.trim()),
        PREFIX_ENABLED: fd.get('PREFIX_ENABLED') === 'on',
        ADMIN_ONLY_MODE: fd.get('ADMIN_ONLY_MODE') === 'on',
        AUTO_ISLAMIC_POST: fd.get('AUTO_ISLAMIC_POST') === 'on',
        TIMEZONE: "Asia/Karachi"
      };
      try {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data)
        });
        const resData = await res.json();
        if(resData.success) showAlert('Config Updated', 'success');
      } catch(e) { showAlert('Update Failed', 'error'); }
    };

    document.getElementById('appstateForm').onsubmit = async (e) => {
      e.preventDefault();
      const val = document.getElementById('appstateInput').value;
      if(val === 'Appstate Loaded') return showAlert('Already Loaded', 'success');
      try {
        const json = JSON.parse(val);
        const res = await fetch('/api/appstate', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({appstate: json})
        });
        const data = await res.json();
        if(data.success) {
          showAlert('Auth Saved', 'success');
          if(!isStarted) toggleBot();
        }
      } catch(e) { showAlert('Invalid JSON', 'error'); }
    };

    let lastLog = '';
    setInterval(async () => {
      try {
        const res = await fetch('/api/logs');
        const data = await res.json();
        const div = document.getElementById('logs');
        const cont = document.getElementById('logBox');
        const newLogs = data.logs.join('\\n');
        if(lastLog !== newLogs) {
          lastLog = newLogs;
          div.innerHTML = data.logs.map(l => '<div class="log-line">' + l + '</div>').join('');
          cont.scrollTop = cont.scrollHeight;
        }
      } catch(e){}
    }, 2000);

    function copyLogs() { 
      navigator.clipboard.writeText(lastLog).then(() => showAlert('Copied!', 'success')); 
    }
    function clearLogs() { 
      fetch('/api/logs/clear', {method: 'POST'}).then(() => { 
        document.getElementById('logs').innerHTML = ''; lastLog = ''; showAlert('Logs Cleared', 'success');
      }); 
    }
  </script>
</body>
</html>
  `);
});

app.post('/api/config', (req, res) => {
  try {
    saveConfig(req.body);
    if (botModule) botModule.loadConfig();
    res.json({ success: true });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

app.post('/api/appstate', (req, res) => {
  try {
    saveAppstate(req.body.appstate);
    res.json({ success: true });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

app.post('/api/start', async (req, res) => {
  try {
    if (botStarted) return res.json({ success: false, error: 'Already Running' });
    if (!fs.existsSync(appstatePath)) return res.json({ success: false, error: 'Auth Missing' });
    if (!botModule) botModule = require('./raza');
    botModule.startBot();
    botStarted = true;
    res.json({ success: true });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

app.post('/api/stop', (req, res) => {
  try {
    if (!botStarted) return res.json({ success: false, error: 'Already Offline' });
    botStarted = false;
    res.json({ success: true });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

app.post('/api/appstate/delete', (req, res) => {
  try {
    if (fs.existsSync(appstatePath)) fs.unlinkSync(appstatePath);
    res.json({ success: true });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

app.post('/api/logs/clear', (req, res) => {
  logHistory.length = 0;
  res.json({ success: true });
});

app.get('/api/logs', (req, res) => {
  res.json({ logs: logHistory });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RAZA BOT: http://0.0.0.0:${PORT}`);
  if (fs.existsSync(appstatePath)) {
    setTimeout(() => {
      botModule = require('./raza');
      botModule.startBot();
      botStarted = true;
    }, 2000);
  }
});
