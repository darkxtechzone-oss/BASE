const fs = require('fs');
const path = require('path');

const MEDIA_DIR = path.join(__dirname, '..', 'media');
const IMAGE_PATH = path.join(MEDIA_DIR, 'menu.jpg');
const AUDIO_PATH = path.join(MEDIA_DIR, 'menu.mp3');

module.exports = {
  name: 'menu',
  description: 'Onyesha menu ya amri zote za bot',
  async execute(sock, msg, args, from) {
    const caption =
      `╭━━━「 *DARKX TUTORIAL BOT* 」━━━╮\n` +
      `┃ 👤 Owner  : MrX Dev\n` +
      `┃ 🔧 Prefix : .\n` +
      `┃ 📦 Version: 1.0.0\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
      `╭─「 *COMMANDS* 」\n` +
      `│ ✅ .ping   - Angalia speed ya bot\n` +
      `│ 📜 .menu   - Onyesha menu hii\n` +
      `│ ℹ️ .alive  - Angalia kama bot iko hai\n` +
      `│ 👑 .owner  - Taarifa za owner\n` +
      `╰────────────────────────\n\n` +
      `_Bot hii ni kwa ajili ya mafunzo (tutorial) chini ya brand DarkX._`;

    // Tuma picha ya menu (kama ipo), vinginevyo tuma text tu
    if (fs.existsSync(IMAGE_PATH)) {
      await sock.sendMessage(
        from,
        { image: fs.readFileSync(IMAGE_PATH), caption },
        { quoted: msg }
      );
    } else {
      await sock.sendMessage(from, { text: caption }, { quoted: msg });
    }

    // Tuma audio ya menu (kama ipo)
    if (fs.existsSync(AUDIO_PATH)) {
      await sock.sendMessage(
        from,
        {
          audio: fs.readFileSync(AUDIO_PATH),
          mimetype: 'audio/mp4',
          ptt: false
        },
        { quoted: msg }
      );
    }
  }
};
