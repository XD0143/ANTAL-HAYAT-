# RAZA-BoT

## Overview

RAZA-BoT is a Facebook Messenger chatbot built with Node.js. It connects to Facebook's Messenger platform using an unofficial Facebook Chat API (FCA) library and provides group management, economy system, media commands, Islamic content posting, and AI chat features. The bot runs an Express web server for configuration/monitoring alongside the Messenger bot process.

The bot is designed for Urdu/Pakistani communities with Islamic content features (scheduled Quran posts, namaz reminders) and supports both English and Roman Urdu interactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Entry Points
- **`index.js`** — Express web server (port 5000) for dashboard/configuration UI and bot management. Reads/writes config and appstate files. Can start the bot module programmatically.
- **`raza.js`** — Main bot process. Logs into Facebook using `raza-fca-pkg` (an FCA library), loads commands/events, sets up cron jobs for Islamic posts, and starts listening for messages.

### Bot Framework Pattern
The bot follows a modular command-handler architecture:

- **Commands** live in `raza/commands/` — each file exports a `config` object (name, aliases, category, permissions) and a `run()` function. Some commands use the older `module.exports.config` / `module.exports.run` pattern.
- **Events** live in `raza/events/` — triggered by non-message events (joins, leaves, etc.)
- **Command loading** is handled by `Data/system/handle/handleRefresh.js` which scans the commands/events directories
- **Message routing** happens in `Data/system/listen.js` which dispatches to handleCommand, handleEvent, handleReaction, handleReply, handleNotification, handleAutoDetect, and handleCreateDatabase

### Key Architectural Components

**Configuration:** `Data/config/envconfig.json` stores bot name, prefix, admin UIDs, toggle flags (admin-only mode, auto Islamic posts), and timezone.

**Authentication:** Uses Facebook cookie-based appstate (`appstate.json`) to maintain login sessions. `RazaFca.json` contains fb_dtsg tokens for API calls. The FCA library (`raza-fca-pkg`) handles the actual Facebook API communication.

**Database Layer:** Uses `better-sqlite3` for local SQLite storage through controller classes:
- `Data/system/controllers/users.js` — User management (banning, names, data)
- `Data/system/controllers/threads.js` — Thread/group management (approval, settings like antijoin/antiout/lock features)
- `Data/system/controllers/currencies.js` — Economy system (wallet, bank, daily rewards, deposits)

**Utility Layer:**
- `Data/utility/send.js` — Wrapper class for sending messages, reactions, and unsending
- `Data/utility/logs.js` — Branded logging with chalk colors, writes to daily log files
- `Data/utility/utils.js` — Time formatting, random helpers, validation

### Command Categories
- **Admin** — Bot admin management, config, broadcast, approve groups, admin-only toggle
- **Group** — Tag all, antijoin, antiout, kick, add, lock settings, group info
- **Economy** — Balance, daily rewards, deposit, bank system
- **Media** — Avatar, GIF search, music download, image editing, cover creation
- **Fun** — Flirt, kiss, hack (novelty), engagement/friend pair image creation
- **Friend** — Accept/decline friend requests, block, friend list, follow
- **Utility** — Help, history, inbox, mute, file management, clear cache
- **AI Chat** — `goibot.js` uses Cerebras AI API for conversational responses with gender detection and chat history

### Permission System
- Commands can be marked `adminOnly: true` (requires being in `ADMINBOT` array)
- Commands can be marked `groupOnly: true`
- Group-level admin checks compare against Facebook group admin list
- `ADMIN_ONLY_MODE` config flag restricts all commands to bot admins only
- Thread approval system controls which groups the bot operates in

### Scheduled Tasks
- Islamic content auto-posting via `node-cron` (Quran ayats, namaz reminders with images)
- Autosend scheduled messages per group

## External Dependencies

### Core Libraries
- **raza-fca-pkg** — Facebook Chat API library for Messenger interaction (login, send/receive messages, manage threads)
- **express** — Web server for dashboard/monitoring (port 5000)
- **better-sqlite3** — Local SQLite database for users, threads, currencies
- **node-cron** — Scheduled task execution (Islamic posts, auto-messages)

### Media & Image Processing
- **jimp** — Image manipulation (circular avatars, pair edits, engagement cards)
- **canvas** — Additional image generation capabilities
- **axios** — HTTP requests for downloading images, calling external APIs

### External APIs Used
- **Cerebras AI API** (`api.cerebras.ai`) — AI chat completions for the goibot command
- **Tenor GIF API** — GIF search and sticker retrieval
- **ImgBB API** — Image hosting/uploading
- **Facebook Graph API** — Profile pictures, user info
- **YouTube search** (`yt-search`) — Music search
- **anabot.my.id API** — YouTube music downloading

### Other Dependencies
- **moment-timezone** — Time handling (Asia/Karachi timezone)
- **chalk** — Colored console output
- **fs-extra** — Enhanced file system operations
- **string-similarity** — Fuzzy command matching
- **node-fetch** — Additional HTTP fetch support