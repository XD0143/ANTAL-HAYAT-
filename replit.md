# RAZA-BoT

## Overview

RAZA-BoT is a Facebook Messenger automation bot built with Node.js. It provides automated group management, Islamic content posting, economy system, and various utility commands for Facebook Messenger groups. The bot uses a custom Facebook Chat API (ikashif-fca/ws3-fca) to interact with Messenger.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Components

1. **Entry Points**
   - `index.js` - Express server (port 5000) providing web dashboard for bot configuration and management
   - `raza.js` - Main bot runtime that handles Facebook Messenger connection and event processing

2. **Facebook Chat API Integration**
   - Located in `Data/raza-fca/` - Custom Facebook Chat API wrapper (ikashif-fca)
   - Handles authentication via `appstate.json` (cookie-based login)
   - Manages automatic token refresh and session persistence
   - Stores Facebook tokens in `RazaFca.json`

3. **Command System**
   - Commands located in `raza/commands/` directory
   - Each command exports a `config` object (name, aliases, description, usage, category, permissions) and a `run` function
   - Commands are dynamically loaded via `Data/system/handle/handleRefresh.js`
   - Client stores commands in a Map: `client.commands`

4. **Event Handling**
   - `Data/system/listen.js` - Main event listener that routes events to appropriate handlers
   - Handlers in `Data/system/handle/`:
     - `handleCommand` - Processes user commands
     - `handleEvent` - Handles system events (join/leave)
     - `handleReaction` - Processes message reactions
     - `handleReply` - Manages reply-based interactions
     - `handleNotification` - Handles Facebook notifications
     - `handleCreateDatabase` - Auto-creates user/thread records

5. **Data Controllers**
   - `Data/system/controllers/users.js` - User management (bans, names, data)
   - `Data/system/controllers/threads.js` - Group management (approval, settings, bans)
   - `Data/system/controllers/currencies.js` - Economy system (balance, bank, daily rewards)

### Configuration

- `Data/config/envconfig.json` - Main bot configuration:
  - BOTNAME, PREFIX, ADMINBOT (admin UIDs)
  - Feature toggles: AUTO_ISLAMIC_POST, AUTO_GROUP_MESSAGE, APPROVE_ONLY, ADMIN_ONLY_MODE
  - TIMEZONE set to Asia/Karachi

- `Data/config/islamic_messages.json` - Islamic content for scheduled posts

### Key Features

1. **Group Management** - Anti-join, anti-out, group admin controls, approval system
2. **Economy System** - Balance, bank, daily rewards, deposits/withdrawals
3. **Islamic Content** - Scheduled Quran verses, Namaz reminders, Islamic posts
4. **Media Commands** - Avatar, GIF search, cover photo generation
5. **Admin Controls** - Broadcast, ban/unban, friend management, configuration

### Database

- Uses file-based JSON storage in `Data/system/database/`
- SQLite via better-sqlite3 for persistent data (user/thread records)
- Cache files stored in `raza/commands/cache/`

## External Dependencies

### NPM Packages
- `ws3-fca` / `ikashif-fca` - Facebook Chat API for Messenger automation
- `express` - Web server for dashboard
- `better-sqlite3` - SQLite database
- `axios` - HTTP requests for external APIs
- `jimp` / `canvas` - Image processing
- `moment-timezone` - Time handling (Asia/Karachi timezone)
- `node-cron` - Scheduled tasks (Islamic posts, auto-messages)
- `yt-search` - YouTube search functionality
- `fs-extra` - Enhanced file system operations

### External APIs
- Facebook Graph API - User avatars, profile data
- Tenor API - GIF search (API key: LIVDSRZULELA)
- ImgBB API - Image hosting
- Cerebras AI API - AI chat functionality (goibot command)

### Authentication
- Facebook session managed via `appstate.json` (cookie-based)
- Automatic fb_dtsg token refresh scheduled daily
- Bot admin UIDs stored in envconfig.json