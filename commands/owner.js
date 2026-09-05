module.exports = {
  name: 'owner',
  description: 'Pata taarifa za owner wa bot',
  async execute(sock, msg, args, from) {
    await sock.sendMessage(
      from,
      {
        text:
          `👑 *OWNER INFO*\n\n` +
          `Jina  : MrX Dev\n` +
          `Brand : DarkX\n\n` +
          `_Bot hii ilitengenezwa kwa ajili ya mafunzo (tutorial) ya jinsi ya kutengeneza WhatsApp bot._`
      },
      { quoted: msg }
    );
  }
};
