// lib/quoted.js
//
// FAILI HII NI MPYA - ujumbe wa "channel" wa kubandika (fake quoted) unaotumiwa
// na baadhi ya plugins kutengeneza forwarded/channel-style replies.

const fquoted = {
  channel: {
    key: {
      fromMe: false,
      participant: '0@s.whatsapp.net',
      remoteJid: '27796262030@s.whatsapp.net'
    },
    message: {
      newsletterAdminInviteMessage: {
        newsletterJid: '0@newsletter',
        newsletterName: 'DarkX',
        caption: 'DarkX Tutorial Bot',
        inviteExpiration: '0'
      }
    }
  }
};

module.exports = { fquoted };
