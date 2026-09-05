module.exports = {
  name: 'ping',
  description: 'Angalia kama bot iko hai na speed yake',
  async execute(sock, msg, args, from) {
    const start = Date.now();
    await sock.sendMessage(from, { text: '🏓 Pinging...' }, { quoted: msg });
    const speed = Date.now() - start;

    await sock.sendMessage(
      from,
      { text: `🏓 *Pong!*\n⚡ Speed: *${speed}ms*` },
      { quoted: msg }
    );
  }
};
