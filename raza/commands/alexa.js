const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Define paths
const CACHE_DIR = path.join(__dirname, 'cache');
const dataPath = path.join(CACHE_DIR, 'alexa_data.json');
const insultHistoryPath = path.join(CACHE_DIR, 'alexa_insult_history.json');
const memoryBase = path.join(CACHE_DIR, 'alexa_memory');

// Array of API keys
const apiKeys = ['csk-4y3ctdcfhprmyedcfnp6n6v6ckmx6wv83pm84ky64mxrefc4'];

module.exports.config = {
  name: "alexa",
  version: "2.0.13",
  hasPermission: 0,
  prefix: false,
  premium: false,
  category: "ai",
  credits: "Talha - Alexa AI",
  description: "Smart Female AI assistant (Alexa) that responds naturally in Urdu/English",
  commandCategory: "ai",
  usages: "alexa on | alexa off | [any message]",
  cooldowns: 3,
  dependencies: {
    "axios": "",
    "fs-extra": ""
  }
};

let alexaActive = true;
let insultHistory = new Map();
const OWNER_ID = "100065216344877"; // Single source of truth

// Initialize directories
function initializeDirectories() {
  try {
    fs.ensureDirSync(CACHE_DIR);
    fs.ensureDirSync(memoryBase);
  } catch (err) {
    console.error('❌ Failed to create directories:', err.message);
  }
}

// Call initialization
initializeDirectories();

// Load insult history
function loadInsultHistory() {
  try {
    if (fs.existsSync(insultHistoryPath)) {
      const data = fs.readJsonSync(insultHistoryPath);
      insultHistory = new Map(Object.entries(data));
    }
  } catch (err) {
    console.error('❌ Failed to load insult history:', err.message);
    insultHistory = new Map();
  }
}

function saveInsultHistory() {
  try {
    fs.writeJsonSync(insultHistoryPath, Object.fromEntries(insultHistory), { spaces: 2 });
  } catch (err) {
    console.error('❌ Failed to save insult history:', err.message);
  }
}

function ensureUserFile(groupID, userID, groupName, userName) {
  try {
    const groupFolder = path.join(memoryBase, groupID);
    fs.ensureDirSync(groupFolder);
    
    const filePath = path.join(groupFolder, `${userID}.json`);
    if (!fs.existsSync(filePath)) {
      const defaultData = {
        name: userName || `User-${userID}`,
        tone: "normal",
        history: [],
        active: true,
        group: groupName || "Unknown Group",
        insultCount: {},
        lastUpdated: new Date().toISOString()
      };
      fs.writeJsonSync(filePath, defaultData, { spaces: 2 });
    }
    return filePath;
  } catch (err) {
    console.error('❌ Failed to ensure user file:', err.message);
    return null;
  }
}

function loadUserData(groupID, userID) {
  try {
    const filePath = path.join(memoryBase, groupID, `${userID}.json`);
    if (fs.existsSync(filePath)) {
      return fs.readJsonSync(filePath);
    }
    return null;
  } catch (err) {
    console.error('❌ Failed to load user data:', err.message);
    return null;
  }
}

function saveUserData(groupID, userID, data) {
  try {
    const filePath = path.join(memoryBase, groupID, `${userID}.json`);
    data.lastUpdated = new Date().toISOString();
    fs.writeJsonSync(filePath, data, { spaces: 2 });
  } catch (err) {
    console.error('❌ Failed to save user data:', err.message);
  }
}

function loadTrainingData() {
  try {
    if (!fs.existsSync(dataPath)) {
      // Create default training data if not exists
      const defaultData = {
        bot_name: 'Alexa AI',
        location: 'Karachi',
        owner: 'Talha (UID: ' + OWNER_ID + ')',
        instructions: [],
        examples: [],
        insult_responses: [
          "Teri gand phaar dungi! 😡",
          "Bhosdi ke, apni shakal dekh pehle! 😠",
          "Tu toh sadak ka kachra hai, bharwe! 😤"
        ]
      };
      fs.writeJsonSync(dataPath, defaultData, { spaces: 2 });
      return defaultData;
    }
    return fs.readJsonSync(dataPath);
  } catch (err) {
    console.error('❌ Failed to load training data:', err.message);
    return { 
      bot_name: 'Alexa AI', 
      location: 'Karachi', 
      owner: 'Talha (UID: ' + OWNER_ID + ')', 
      instructions: [], 
      examples: [], 
      insult_responses: [] 
    };
  }
}

function detectTone(message) {
  if (!message) return "normal";
  const romantic = ["love", "jaan", "baby", "sweetheart", "pyar", "ishq", "mohabbat"];
  const funny = ["joke", "fun", "hasna", "meme", "mazak", "hansi", "lol"];
  const deep = ["zindagi", "dard", "alone", "emotional", "sad", "udaas", "tanhai"];
  const angry = ["gussa", "angry", "naraz", "pagal", "bewakoof"];
  
  const lc = message.toLowerCase();
  if (romantic.some(word => lc.includes(word))) return "romantic";
  if (funny.some(word => lc.includes(word))) return "funny";
  if (deep.some(word => lc.includes(word))) return "deep";
  if (angry.some(word => lc.includes(word))) return "angry";
  return "normal";
}

function detectInsultType(message) {
  if (!message) return null;
  const lc = message.toLowerCase();
  const insultCategories = {
    "gando": ["gando", "gandu", "gaandu"],
    "madarchod": ["madarchod", "mc", "mader chod"],
    "bhenchod": ["bhenchod", "bc", "bhen chod", "behenchod"],
    "chutiya": ["chutiya", "chutya", "chut", "chutmarika"],
    "harami": ["harami", "haramkhor", "haramzada"],
    "randi": ["randi", "randwa", "rnd"],
    "kutta": ["kutta", "kutte", "kameena", "kamina"],
    "suar": ["suar", "suwar"],
    "bhosdike": ["bhosdike", "bhosdiwala", "bhosda"],
    "lund": ["lund", "loda", "lodu"],
    "teri_ma": ["teri ma", "teri maa", "teri ammi", "tumhari ma"],
    "general_abuse": ["fuck", "bastard", "idiot", "stupid", "fool", "saale", "bharwe"]
  };

  for (const [category, keywords] of Object.entries(insultCategories)) {
    if (keywords.some(word => lc.includes(word))) {
      return category;
    }
  }
  return null;
}

function getContextualInsult(insultType, userData, trainingData) {
  const contextualResponses = {
    "gando": [
      "Tu gando hai bharway, chal tu nikal! 😡",
      "Oye gandu, teri shakal dekh kar kutte bhi bhaag jaate hain! 😠",
      "Gando kahta hai mujhe? Tera baap gando, teri nasl gando! 😤"
    ],
    "madarchod": [
      "Madarchod tu hai, teri ma ka bhosda! 😡",
      "Apni ma ko dekh pehle, phir doosron ko madarchod bol! 😠",
      "Teri ma ki choot, tu madarchod hai khud! 😤"
    ],
    "bhenchod": [
      "Bhenchod tu hai, teri behen ko stage pe nacha dungi! 😡",
      "Apni behen sambhal pehle, phir doosron ko bhenchod bol! 😠",
      "Teri behen ka bhosda, chal nikal bharwe! 😤"
    ],
    "chutiya": [
      "Chutiya tu hai, tera dimag toh kachre ke dabbe mein hai! 😡",
      "Chutiya bolte hain? Mirror dekha hai kabhi? 😠",
      "Tera poora khandaan chutiya hai, bharwe! 😤"
    ],
    "harami": [
      "Harami tu hai, teri ma randikhane mein kaam karti hai! 😡",
      "Haramkhor kahta hai? Tera baap hi harami tha! 😠",
      "Harami ki aulaad, teri gand phaar dungi! 😤"
    ],
    "teri_ma": [
      "Teri ma ko bhagao, bhosdi ke teri ma ki choot! 😡",
      "Teri ammi ka bhosda, tu sadak ka sasta bharwa hai! 😠",
      "Teri ma ki choot mein keeda, chal nikal! 😤"
    ],
    "general_abuse": [
      "Teri aukaat kya hai bolne wali? Chal nikal! 😡",
      "Bhosdi ke, apni shakal dekh pehle! 😠",
      "Tu toh sadak ka kachra hai, bharwe! 😤"
    ]
  };

  const responses = contextualResponses[insultType] || trainingData.insult_responses || 
    ["Teri maa ki choot! 😡", "Bhosdi ke! 😠", "Chal nikal yahan se! 😤"];
  
  const userKey = `${userData.group}_${userData.name || 'Unknown'}`;
  if (!insultHistory.has(userKey)) {
    insultHistory.set(userKey, []);
  }

  const userInsultHistory = insultHistory.get(userKey);
  const availableInsults = responses.filter(insult => !userInsultHistory.includes(insult));

  let selectedInsult;
  if (availableInsults.length > 0) {
    selectedInsult = availableInsults[Math.floor(Math.random() * availableInsults.length)];
  } else {
    insultHistory.set(userKey, []);
    selectedInsult = responses[Math.floor(Math.random() * responses.length)];
  }

  userInsultHistory.push(selectedInsult);
  if (userInsultHistory.length > 10) {
    userInsultHistory.shift();
  }
  saveInsultHistory();

  return selectedInsult;
}

function shouldRespond({ body, mentions }, botID) {
  if (!body) return false;
  if (!alexaActive) return false;
  
  // Check if bot is mentioned
  if (mentions && mentions[botID]) return true;
  
  // Check if message starts with "alexa" (case insensitive)
  if (body.toLowerCase().startsWith("alexa")) return true;
  
  return false;
}

function getFastResponse(message, isOwner, tone, trainingData) {
  if (!message) return null;
  
  const lc = message.toLowerCase();
  
  if (isOwner) {
    if (lc.includes("kya haal") || lc.includes("kaisa hai")) return "Boss, maze mein hoon! 😎 Aap ka intezaar tha!";
    if (lc.includes("love") || lc.includes("pyar") || lc.includes("ishq")) return "Boss, aap ki har baat dil mein baith jaati hai! 💕";
    if (lc.includes("joke") || lc.includes("mazak") || lc.includes("hansi")) return "Boss ke saath toh har waqt mazak hi mazak! 😂 Kya kahiye!";
    if (lc.includes("thanks") || lc.includes("shukriya")) return "Welcome Boss! 😊 Koi baat nahi!";
  } else {
    if (lc.includes("hello") || lc.includes("hi") || lc.includes("salam") || lc.includes("assalam")) {
      return "Hello! Main Alexa AI hoon! 😊 Kya madad chahiye?";
    }
    if (lc.includes("kya haal") || lc.includes("kaisa hai") || lc.includes("kaisi ho")) {
      return "Main toh theek hoon! 😊 Tum batao, kya chal raha hai?";
    }
    if (lc.includes("love") || lc.includes("pyar") || lc.includes("ishq")) {
      return "Aww! 💕 Pyar ki baatein! Kya romantic mood hai! 😊";
    }
    if (lc.includes("thanks") || lc.includes("shukriya") || lc.includes("thank you")) {
      return "Welcome yaar! 😊 Koi baat nahi!";
    }
    if (lc.includes("joke") || lc.includes("mazak") || lc.includes("hansi")) {
      return "Haha! 😂 Mazak ka mood hai! Main bhi ready hoon!";
    }
    if (lc.includes("bye") || lc.includes("allah hafiz") || lc.includes("khuda hafiz")) {
      return "Allah Hafiz! 😊 Phir milte hain!";
    }
  }
  return null;
}

async function getAIResponse(messages, isOwner, senderID, userMessage, tone, trainingData) {
  // Check for fast response first
  const fastResponse = getFastResponse(userMessage, isOwner, tone, trainingData);
  if (fastResponse) {
    return fastResponse;
  }

  // Try each API key until one works
  for (const apiKey of apiKeys) {
    try {
      const response = await axios.post('https://api.cerebras.ai/v1/chat/completions', {
        messages: messages,
        model: 'llama3.1-8b',
        max_completion_tokens: 150,
        temperature: 0.8,
        top_p: 0.9,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      });

      let aiResponse = response.data?.choices?.[0]?.message?.content?.trim() || "";
      
      // Validate response
      if (!aiResponse || 
          aiResponse.length < 2 ||
          aiResponse.includes("I can't respond") || 
          aiResponse.includes("I won't engage") || 
          aiResponse.includes("I cannot provide") ||
          aiResponse.includes("explicit or harmful") ||
          aiResponse.includes("inappropriate") ||
          aiResponse.includes("offensive") ||
          aiResponse.includes("I cannot create") ||
          aiResponse.includes("I'm not able to")) {
        continue; // Try next API key
      }

      // Clean up response
      aiResponse = aiResponse.replace(/^\n+|\n+$/g, '').replace(/\n{3,}/g, '\n\n');
      aiResponse = aiResponse.substring(0, 400);
      
      // Limit to 3-4 lines max
      const lines = aiResponse.split('\n').filter(line => line.trim() !== '').slice(0, 4);
      return lines.join('\n');

    } catch (error) {
      console.error(`❌ API Key ${apiKey.substring(0, 10)}... Error:`, error.message);
      continue; // Try next key
    }
  }

  // Fallback responses if all APIs fail
  return isOwner 
    ? `Boss, kya haal hai? Main ready hoon! 😎` 
    : `Haan bhai, kya chahiye? Main yahan hoon! 😊`;
}

module.exports.handleEvent = async function ({ api, event }) {
  if (!alexaActive) return;
  
  const { threadID, senderID, body, mentions, messageID, messageReply } = event;
  if (!body && !messageReply) return;

  // Handle commands
  if (body) {
    const cmd = body.toLowerCase().trim();
    if (cmd === "alexa on") {
      alexaActive = true;
      return api.sendMessage("✅ Alexa AI is now ON! 😊", threadID, messageID);
    }
    if (cmd === "alexa off") {
      alexaActive = false;
      return api.sendMessage("😴 Alexa AI is now OFF!", threadID, messageID);
    }
    if (cmd === "alexa status") {
      return api.sendMessage(alexaActive ? "📶 Alexa AI is active!" : "📴 Alexa AI is inactive!", threadID, messageID);
    }
  }

  // Check if we should respond
  if (!shouldRespond({ body, mentions }, api.getCurrentUserID()) &&
      (!messageReply || messageReply.senderID !== api.getCurrentUserID())) {
    return;
  }

  try {
    // Get thread and user info
    const threadInfo = await api.getThreadInfo(threadID).catch(() => ({ threadName: "Unknown Group" }));
    const userInfo = await api.getUserInfo(senderID).catch(() => ({}));
    
    const groupName = threadInfo.threadName || "Unknown Group";
    const userName = userInfo[senderID]?.name || `User-${senderID}`;
    
    // Ensure user file exists
    const filePath = ensureUserFile(threadID, senderID, groupName, userName);
    if (!filePath) {
      return api.sendMessage("Technical issue, baad mein try karo! 😅", threadID, messageID);
    }
    
    let userData = loadUserData(threadID, senderID);
    if (!userData) {
      userData = {
        name: userName,
        tone: "normal",
        history: [],
        active: true,
        group: groupName,
        insultCount: {}
      };
    }
    
    userData.active = true;
    
    // Get message content
    let msg = body?.trim() || "";
    if (!msg && messageReply) {
      msg = messageReply.body?.trim() || "";
    }
    
    // Remove "alexa" prefix if present
    let cleanMsg = msg.replace(/^alexa\s*/i, "").trim();
    if (!cleanMsg) return;

    const isOwner = senderID === OWNER_ID;

    // Load data
    loadInsultHistory();
    const trainingData = loadTrainingData();

    // Handle owner identification
    if (cleanMsg.toLowerCase().includes("owner") || 
        cleanMsg.toLowerCase().includes("tumhara malik") || 
        cleanMsg.toLowerCase().includes("kisne banaya") || 
        cleanMsg.toLowerCase().includes("talha")) {
      
      let reply;
      if (isOwner) {
        reply = `Boss Talha, aap ka intezaar tha! 😘 Kya hukum hai?`;
      } else {
        reply = `Mera boss sirf UID ${OWNER_ID} wala Talha hai! 😡`;
      }
      
      // Update history
      userData.history.push({ role: "user", content: cleanMsg, uid: senderID });
      userData.history.push({ role: "assistant", content: reply, uid: senderID });
      if (userData.history.length > 20) userData.history = userData.history.slice(-20);
      
      saveUserData(threadID, senderID, userData);
      return api.sendMessage(reply, threadID, messageID);
    }

    // Handle insults
    const insultType = detectInsultType(cleanMsg);
    if (!isOwner && insultType) {
      const contextualInsult = getContextualInsult(insultType, userData, trainingData);
      
      userData.history.push({ role: "user", content: cleanMsg, uid: senderID });
      userData.history.push({ role: "assistant", content: contextualInsult, uid: senderID });
      if (userData.history.length > 20) userData.history = userData.history.slice(-20);
      
      saveUserData(threadID, senderID, userData);
      return api.sendMessage(contextualInsult, threadID, messageID);
    }

    // Send typing indicator
    api.sendTypingIndicator(threadID);
    
    // Update tone and history
    userData.tone = detectTone(cleanMsg);
    userData.history.push({ role: "user", content: cleanMsg, uid: senderID });
    if (userData.history.length > 20) userData.history = userData.history.slice(-20);

    // Prepare messages for API
    const systemPrompt = `You are Alexa AI, a smart, witty and helpful female AI assistant. Your owner is Talha (UID: ${OWNER_ID}). You speak naturally in Urdu-English mix (Romanized Urdu). 

For Owner (UID ${OWNER_ID}): Respond lovingly and playfully.
For others: Be smart, helpful and friendly.

Current User: ${userName} (UID: ${senderID}) in group "${groupName}"
Current tone: ${userData.tone}

Key Rules:
- You are a female AI
- Use local expressions naturally (yaar, bhai, boss, etc)
- Keep responses concise (2-4 lines max)
- Sound human, not robotic
- Be engaging and personable`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...userData.history.slice(-10).map(entry => ({
        role: entry.role,
        content: entry.role === "user" ? `${entry.content}` : entry.content
      }))
    ];

    // Get AI response
    const reply = await getAIResponse(messages, isOwner, senderID, cleanMsg, userData.tone, trainingData);
    
    // Update history with response
    userData.history.push({ role: "assistant", content: reply, uid: senderID });
    if (userData.history.length > 20) userData.history = userData.history.slice(-20);
    
    saveUserData(threadID, senderID, userData);
    
    // Send response
    api.sendMessage(reply, threadID, messageID);
    
  } catch (err) {
    console.error("❌ Alexa HandleEvent Error:", err.message);
    api.sendMessage("Technical issue hai, baad mein try karo! 😅", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const input = args[0]?.toLowerCase() || "";

  try {
    // Get thread and user info
    const threadInfo = await api.getThreadInfo(threadID).catch(() => ({ threadName: "Unknown Group" }));
    const userInfo = await api.getUserInfo(senderID).catch(() => ({}));
    
    const groupName = threadInfo.threadName || "Unknown Group";
    const userName = userInfo[senderID]?.name || `User-${senderID}`;
    const isOwner = senderID === OWNER_ID;
    
    // Ensure user file exists
    const filePath = ensureUserFile(threadID, senderID, groupName, userName);
    if (!filePath) {
      return api.sendMessage("Technical issue, baad mein try karo! 😅", threadID, messageID);
    }
    
    let userData = loadUserData(threadID, senderID);
    if (!userData) {
      userData = {
        name: userName,
        tone: "normal",
        history: [],
        active: false,
        group: groupName,
        insultCount: {}
      };
    }

    // Handle commands
    if (input === "on") {
      alexaActive = true;
      userData.active = true;
      saveUserData(threadID, senderID, userData);
      
      const welcomeMsg = isOwner
        ? `🎉 Welcome back, Boss Talha! Alexa AI is active! 👑\nChat anytime! 😎`
        : `🎉 Alexa AI activated for ${userName}! 🤖\nChat anytime! 😊`;
      
      return api.sendMessage(welcomeMsg, threadID, messageID);
      
    } else if (input === "off") {
      alexaActive = false;
      userData.active = false;
      saveUserData(threadID, senderID, userData);
      
      return api.sendMessage(`😴 Alexa AI off for ${userName}.\nUse 'alexa on' to reactivate!`, threadID, messageID);
      
    } else if (input === "status") {
      return api.sendMessage(alexaActive ? "📶 Active hoon!" : "📴 Inactive hoon.", threadID, messageID);
      
    } else if (input === "clear" || input === "reset") {
      // Clear chat history for this user
      userData.history = [];
      saveUserData(threadID, senderID, userData);
      return api.sendMessage("🧹 Chat history cleared!", threadID, messageID);
      
    } else if (args.length > 0) {
      // Handle chat message
      if (!alexaActive) {
        return api.sendMessage(`❌ Alexa AI inactive. Use 'alexa on' to start!`, threadID, messageID);
      }

      const userMessage = args.join(" ");
      if (!userMessage.trim()) {
        return api.sendMessage(`Hey ${userData.name}! 😊\nKuch likho to sahi!`, threadID, messageID);
      }

      // Load data
      loadInsultHistory();
      const trainingData = loadTrainingData();

      // Handle owner identification
      if (userMessage.toLowerCase().includes("owner") || 
          userMessage.toLowerCase().includes("tumhara malik") || 
          userMessage.toLowerCase().includes("kisne banaya") ||
          userMessage.toLowerCase().includes("talha")) {
        
        let reply;
        if (isOwner) {
          reply = `Boss Talha, aap ka intezaar tha! 😘 Kya hukum hai?`;
        } else {
          reply = `Mera boss sirf UID ${OWNER_ID} wala Talha hai! 😡`;
        }
        
        userData.history.push({ role: "user", content: userMessage, uid: senderID });
        userData.history.push({ role: "assistant", content: reply, uid: senderID });
        if (userData.history.length > 20) userData.history = userData.history.slice(-20);
        
        saveUserData(threadID, senderID, userData);
        return api.sendMessage(reply, threadID, messageID);
      }

      // Handle insults
      const insultType = detectInsultType(userMessage);
      if (!isOwner && insultType) {
        const contextualInsult = getContextualInsult(insultType, userData, trainingData);
        
        userData.history.push({ role: "user", content: userMessage, uid: senderID });
        userData.history.push({ role: "assistant", content: contextualInsult, uid: senderID });
        if (userData.history.length > 20) userData.history = userData.history.slice(-20);
        
        saveUserData(threadID, senderID, userData);
        return api.sendMessage(contextualInsult, threadID, messageID);
      }

      // Send typing indicator
      api.sendTypingIndicator(threadID);
      
      // Update tone and history
      userData.tone = detectTone(userMessage);
      userData.history.push({ role: "user", content: userMessage, uid: senderID });
      if (userData.history.length > 20) userData.history = userData.history.slice(-20);

      // Prepare messages for API
      const systemPrompt = `You are Alexa AI, a smart, witty and helpful female AI assistant. Your owner is Talha (UID: ${OWNER_ID}). You speak naturally in Urdu-English mix (Romanized Urdu). 

For Owner (UID ${OWNER_ID}): Respond lovingly and playfully.
For others: Be smart, helpful and friendly.

Current User: ${userName} (UID: ${senderID}) in group "${groupName}"
Current tone: ${userData.tone}

Key Rules:
- You are a female AI
- Use local expressions naturally (yaar, bhai, boss, etc)
- Keep responses concise (2-4 lines max)
- Sound human, not robotic
- Be engaging and personable`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...userData.history.slice(-10).map(entry => ({
          role: entry.role,
          content: entry.role === "user" ? `${entry.content}` : entry.content
        }))
      ];

      // Get AI response
      const reply = await getAIResponse(messages, isOwner, senderID, userMessage, userData.tone, trainingData);
      
      // Update history with response
      userData.history.push({ role: "assistant", content: reply, uid: senderID });
      if (userData.history.length > 20) userData.history = userData.history.slice(-20);
      
      saveUserData(threadID, senderID, userData);
      
      // Send response
      api.sendMessage(reply, threadID, messageID);
      
    } else {
      // Show help menu
      const helpMsg = `📘 **Alexa AI Commands**:
• alexa on - Activate Alexa
• alexa off - Deactivate Alexa
• alexa status - Check status
• alexa clear - Clear history
• [any message] - Chat with Alexa

💡 **Tips**:
• Mention @Alexa or start with "alexa"
• Ask anything in Urdu/English
• Be respectful for better responses`;

      api.sendMessage(helpMsg, threadID, messageID);
    }
    
  } catch (error) {
    console.error('❌ ALEXA AI RUN ERROR:', error.message);
    const errorMsg = isOwner
      ? `❌ Boss, technical problem! 🔧`
      : `❌ Sorry! Technical issue hai 😅`;
    api.sendMessage(errorMsg, threadID, messageID);
  }
};

// Clean up old files periodically (optional)
function cleanupOldFiles() {
  try {
    const groups = fs.readdirSync(memoryBase);
    const now = Date.now();
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    
    for (const group of groups) {
      const groupPath = path.join(memoryBase, group);
      const users = fs.readdirSync(groupPath);
      
      for (const userFile of users) {
        const filePath = path.join(groupPath, userFile);
        const stats = fs.statSync(filePath);
        
        // Delete files older than 1 week
        if (now - stats.mtimeMs > ONE_WEEK) {
          fs.removeSync(filePath);
        }
      }
    }
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}

// Run cleanup every hour
setInterval(cleanupOldFiles, 60 * 60 * 1000);
