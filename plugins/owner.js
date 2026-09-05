const config = require('../settings/config');

module.exports = {
  command: 'owner',
  description: 'Pata taarifa za owner wa bot',
  category: 'owner',
  execute: async (sock, m, { reply }) => {
    await reply(
      `👑 *OWNER INFO*\n\n` +
        `Jina  : ${config.owner}\n` +
        `Brand : DarkX\n\n` +
        `_Bot hii ilitengenezwa kwa ajili ya mafunzo (tutorial) ya jinsi ya kutengeneza WhatsApp bot._`
    );
  }
};
