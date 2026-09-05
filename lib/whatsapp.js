// Baileys inapakiwa kwa "dynamic import" kwa sababu v7 ni ESM-only.
let makeWASocket, Browsers, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion;

const loadBaileys = async () => {
  const baileys = await import('@whiskeysockets/baileys');
  makeWASocket = baileys.default;
  Browsers = baileys.Browsers;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
  DisconnectReason = baileys.DisconnectReason;
  fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
};

const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const handler = require('./handler');

const SESSION_DIR = path.join(__dirname, '..', 'session');

// Weka namba yako hapa kama unataka pairing "moja kwa moja" (bila web) -
// mfano: '255712345678'. Kama umeiacha wazi (''), bot itasubiri namba
// kutoka kwenye ukurasa wa web (public/index.html).
const DIRECT_PAIRING_NUMBER = process.env.PAIRING_NUMBER || '';

let sock = null;
let status = 'INITIALIZING'; // INITIALIZING | WAITING_FOR_NUMBER | CONNECTED | CLOSED
let isResetting = false; // inazuia connection.update kufanya reconnect wakati wa session reset ya makusudi

// Futa yaliyomo yote ya folder la session (isipokuwa .gitkeep) ili namba mpya
// ianze na credentials safi - bila kuhitaji mtu kufuta folder mwenyewe.
function clearSessionFiles() {
  try {
    if (!fs.existsSync(SESSION_DIR)) return;
    for (const file of fs.readdirSync(SESSION_DIR)) {
      if (file === '.gitkeep') continue;
      fs.rmSync(path.join(SESSION_DIR, file), { recursive: true, force: true });
    }
    console.log('🧹 Session ya zamani imefutwa - tayari kwa namba mpya.');
  } catch (e) {
    console.error('Imeshindwa kufuta session:', e.message);
  }
}

async function startSock() {
  if (!makeWASocket) await loadBaileys();

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  // MUHIMU: Baileys/WhatsApp huwa strict na "browser fingerprint" wakati wa
  // pairing code. Kutumia jina la kubuni (mfano ['MyBot','Chrome','1.0'])
  // mara nyingi ndio sababu ya pairing code kutokuwa sahihi / kufeli.
  // Hapa tunatumia orodha ya browsers halisi zinazotambulika na WhatsApp,
  // na kuchagua moja randomly kila mara bot inapoanza.
  const browserOptions = [
    Browsers.macOS('Safari'),
    Browsers.macOS('Chrome'),
    Browsers.macOS('Edge'),
    Browsers.windows('Firefox'),
    Browsers.windows('Edge'),
    Browsers.ubuntu('Chrome')
  ];
  const randomBrowser = browserOptions[Math.floor(Math.random() * browserOptions.length)];

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: randomBrowser
  });

  sock.ev.on('creds.update', saveCreds);

  // Njia ya 1: pairing "moja kwa moja" kwa kutumia namba iliyowekwa kwenye env (terminal/log)
  if (!sock.authState.creds.registered && DIRECT_PAIRING_NUMBER) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(DIRECT_PAIRING_NUMBER.replace(/[^0-9]/g, ''));
        console.log(`\n🔑 PAIRING CODE (${DIRECT_PAIRING_NUMBER}): ${code}\n`);
        console.log('👉 Fungua WhatsApp > Linked Devices > Link with phone number, kisha weka code hii.');
      } catch (e) {
        console.error('Imeshindwa kutengeneza pairing code moja kwa moja:', e.message);
      }
    }, 3000);
  }

  status = sock.authState.creds.registered ? 'CONNECTED' : 'WAITING_FOR_NUMBER';

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      status = 'CLOSED';
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (isResetting) {
        // Reset ya makusudi (namba mpya kwenye web) - startSock() mpya
        // itaanzishwa na getPairingCodeForNumber, sio hapa.
        return;
      }

      console.log('❌ Connection imefungwa.', shouldReconnect ? 'Inajaribu kuunganisha tena...' : 'Umetoka (logged out).');
      if (shouldReconnect) startSock();
    } else if (connection === 'open') {
      status = 'CONNECTED';
      console.log('✅ DarkX Tutorial Bot imeunganishwa na WhatsApp kwa mafanikio!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    try {
      await handler(sock, msg);
    } catch (e) {
      console.error('Handler error:', e);
    }
  });

  return sock;
}

// Njia ya 2: pairing kupitia web - inaitwa na /api/pair (ona index.js na public/index.html)
// Kila namba mpya inayowekwa kwenye web inafuta session ya zamani (kama ipo)
// na kuanzisha connection mpya kabisa - hakuna haja ya kufuta folder mwenyewe.
async function getPairingCodeForNumber(number) {
  const cleanNumber = number.replace(/[^0-9]/g, '');
  if (cleanNumber.length < 8) {
    throw new Error('Namba haionekani sahihi. Weka namba kamili yenye country code, mfano 255712345678');
  }

  const alreadyLinked = sock && sock.authState?.creds?.registered;

  if (alreadyLinked || sock) {
    isResetting = true;
    console.log('🔄 Namba mpya imepokelewa - inasafisha session ya awali...');
    try {
      sock.end(new Error('Session reset kwa ajili ya namba mpya'));
    } catch (e) {
      // sock inaweza kuwa tayari imefungwa, endelea tu
    }
    clearSessionFiles();
    await startSock();
    isResetting = false;
  } else {
    await startSock();
  }

  if (!sock) throw new Error('Socket bado haijaanzishwa, subiri kidogo kisha jaribu tena.');

  const code = await sock.requestPairingCode(cleanNumber);
  return code;
}

function getStatus() {
  return status;
}

module.exports = { startSock, getPairingCodeForNumber, getStatus };
