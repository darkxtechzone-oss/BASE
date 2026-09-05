const fs = require('fs');
const path = require('path');

const PREFIX = '.';
const commands = new Map();

const commandsPath = path.join(__dirname, '..', 'commands');
fs.readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'))
  .forEach((file) => {
    const command = require(path.join(commandsPath, file));
    commands.set(command.name, command);
    console.log(`🔌 Command imepakiwa: .${command.name}`);
  });

module.exports = async function handler(sock, msg) {
  const from = msg.key.remoteJid;

  const body =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    msg.message.imageMessage?.caption ||
    msg.message.videoMessage?.caption ||
    '';

  if (!body || !body.startsWith(PREFIX)) return;

  const args = body.slice(PREFIX.length).trim().split(/\s+/);
  const cmdName = args.shift().toLowerCase();

  const command = commands.get(cmdName);
  if (!command) return;

  try {
    await command.execute(sock, msg, args, from);
  } catch (err) {
    console.error(`Kosa kwenye command .${cmdName}:`, err);
    await sock.sendMessage(from, { text: '⚠️ Kuna kosa limetokea, jaribu tena baadaye.' }, { quoted: msg });
  }
};
