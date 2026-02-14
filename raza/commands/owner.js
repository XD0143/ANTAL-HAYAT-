const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'owner',
    aliases: ['dev', 'creator', 'developer'],
    description: 'Show bot owner information',
    usage: 'owner',
    category: 'Info',
    prefix: false
  },

  async run({ api, event, send, config }) {
    const { threadID, messageID } = event;

    const ownerPics = [
      'https://i.ibb.co/672Zf20L/99ea4edb30db.jpg',
      'https://i.ibb.co/bRBZxk9v/20df2c060ec2.jpg',
      'https://i.ibb.co/gMkf5Dmk/252782e1baf1.jpg',
      'https://i.ibb.co/PspxZNzh/b247dec7d443.jpg'
    ];

    const randomPic = ownerPics[Math.floor(Math.random() * ownerPics.length)];

    const ownerInfo = `
╔════════════════════════╗
║   ✨ 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎 ✨   ║
╠════════════════════════╣
║                            ║
║  👤 𝐍𝐚𝐦𝐞: 𝐓𝐚𝐥𝐡𝐚 𝐏𝐚𝐭𝐡𝐚𝐍       ║
║                           ║
╠═══════════════════════╣
║  📱 𝐂𝐨𝐧𝐭𝐚𝐜𝐭 𝐈𝐧𝐟𝐨:          ║
║                           ║
║  🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤:              ║
║  https://www.facebook.com/broken019876 ║
║                           ║
║  📲 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩:              ║
║  𝐏𝐫𝐢𝐯𝐚𝐭𝐞 𝐇𝐚𝐢𝐢 𝐛𝐎𝐬𝐬       ║
║                           ║
╠═══════════════════════════╣
║  🤖 𝐁𝐨𝐭 𝐃𝐞𝐭𝐚𝐢𝐥𝐬:           ║
║                           ║
║  📛 Name: ${config.BOTNAME || 'TALHA'
║  ⚡ Prefix: ${config.PREFIX || '.'}
║  💻 Version: 2.0.0        ║
║  🛠️ Framework: WS3-FCA    ║
║                           ║
╠═══════════════════════════╣
║  💝 𝙏𝙝𝙖𝙣𝙠 𝙮𝙤𝙪 𝙛𝙤𝙧 𝙪𝙨𝙞𝙣𝙜!  ║
╚═══════════════════════════╝
    `.trim();

    try {
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);
      const imgPath = path.join(cacheDir, `owner_${Date.now()}.jpg`);
      
      const response = await axios.get(randomPic, { responseType: 'arraybuffer' });
      fs.writeFileSync(imgPath, Buffer.from(response.data));
      
      api.sendMessage(
        {
          body: ownerInfo,
          attachment: fs.createReadStream(imgPath)
        },
        threadID,
        () => {
          try { fs.unlinkSync(imgPath); } catch {}
        },
        messageID
      );
    } catch (error) {
      return send.reply(ownerInfo);
    }
  }
};
