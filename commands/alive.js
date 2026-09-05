module.exports = {
  name: 'alive',
  description: 'Angalia kama bot iko online',
  async execute(sock, msg, args, from) {
    await sock.sendMessage(
      from,
      { text: '✅ *DarkX Tutorial Bot iko hai na inafanya kazi vizuri!* 🟢' },
      { quoted: msg }
    );
  }
};
