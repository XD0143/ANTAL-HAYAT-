# RAZA-BoT 🤖

RAZA-BoT is a powerful Facebook Messenger bot built with Node.js, designed for group management, Islamic content automation, and community engagement.

## 🚀 Features
- **Group Management:** Anti-join, anti-out, name lock, and more.
- **Islamic Content:** Automatic Quran Ayats and Namaz reminders.
- **Economy System:** Virtual currency, bank, and daily rewards.
- **AI Chat:** Smart conversational responses powered by Cerebras AI.
- **Media Tools:** Music download, image editing, and GIF search.

---

## 🛠️ Deployment Methods

### 1. Deploy on Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Set the following:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add a `PORT` environment variable set to `5000`.
5. Render will automatically use the `/health` endpoint for health checks.

### 2. Deploy on Bot-Hosting
1. Create a Node.js instance on your hosting provider.
2. Upload all files.
3. Set the main file to `index.js`.
4. Ensure port `5000` is open for the web dashboard.
5. Use `npm start` to run both the dashboard and the bot.

### 3. Deploy on GitHub (Manual/VPS)
1. Fork this repository.
2. Clone it to your VPS: `git clone https://github.com/your-username/raza-bot.git`
3. Install dependencies: `npm install`
4. Start the bot: `npm start`

---

## 🔄 Workflow
The bot uses a dual-process workflow:
- **Web Dashboard (`index.js`):** Runs on port 5000, provides a UI for configuration and logs.
- **Bot Engine (`raza.js`):** Handles Facebook Messenger connections and commands.
- **Auto-Restart:** If the bot crashes, the web dashboard will attempt to restart the engine.

---

## 👤 Owner & Contact
- **Developer:** RAZA
- **WhatsApp:** [+92 300 1677853](https://wa.me/923001677853)
- **Facebook:** [Raza Official](https://facebook.com/100004370672067)
- **Channel:** [Join Our Channel](https://whatsapp.com/channel/0029Vb7Svri7oQhZNL7e5u2b)

---
Made with ❤️ by RAZA Team
