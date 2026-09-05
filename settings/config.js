// settings/config.js
//
// Mipangilio mikuu inayotumiwa na message.js na plugins/*.js
// FAILI HII NI MPYA - imeongezwa kusaidia mfumo mpya wa message.js.

module.exports = {
  owner: process.env.OWNER_NAME || 'MrX Dev',
  botNumber: process.env.PAIRING_NUMBER || '-',
  thumbUrl: 'https://i.imgur.com/IkEv97P.jpeg',
  status: {
    public: true
  },
  settings: {
    title: 'DarkX Tutorial Bot',
    packname: 'DARKX-BASE',
    description: 'Bot hii ilitengenezwa kwa ajili ya mafunzo (tutorial) chini ya brand DarkX.',
    author: 'MrX Dev',
    footer: 'Powered by DarkX'
  },
  api: {
    baseurl: 'https://hector-api.vercel.app/',
    apikey: 'hector'
  }
};
