// mongoAuthState.js
//
// Inatunza session (auth state) ya Baileys kwenye MongoDB, ili bot isipoteze
// session kila "deploy" mpya (mfano Render inapoanzisha upya server).
//
// - Kama MONGODB_URI ipo kwenye .env -> session inahifadhiwa MongoDB, na kila
//   bot inapoanza inajaribu kurudisha (restore) session iliyopo.
// - Kama MONGODB_URI HAIPO -> bot HAIZUIWI kuunganisha; inatumia faili la JSON
//   la kawaida (folder la session/) kama zamani.
// - clearSession() inafuta session (Mongo na/au faili) - inaitwa pale session
//   inapoharibika (bad session) au mtumiaji ame-logout kwenye WhatsApp.

const fs = require('fs');
const path = require('path');

const MONGODB_URI =
  process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL || '';
const SESSION_ID = process.env.SESSION_ID || 'default';
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || 'baileys_sessions';

// Baileys v7 ni ESM-only, hivyo tunapakia baadhi ya "utils" zake kwa dynamic import.
let initAuthCreds, BufferJSON, proto, useMultiFileAuthState;
async function loadBaileysUtils() {
  if (initAuthCreds) return;
  const baileys = await import('@whiskeysockets/baileys');
  initAuthCreds = baileys.initAuthCreds;
  BufferJSON = baileys.BufferJSON;
  proto = baileys.proto;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
}

let mongoClientPromise = null;
function getMongoClient() {
  if (!mongoClientPromise) {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    });
    mongoClientPromise = client.connect().then(() => client);
  }
  return mongoClientPromise;
}

// ---------- Njia ya 1: MongoDB ----------
async function useMongoAuthState() {
  await loadBaileysUtils();

  const client = await getMongoClient();
  const collection = client.db().collection(COLLECTION_NAME);

  const docId = (key) => `${SESSION_ID}::${key}`;

  const readData = async (key) => {
    try {
      const doc = await collection.findOne({ _id: docId(key) });
      if (!doc || doc.value === undefined) return null;
      return JSON.parse(JSON.stringify(doc.value), BufferJSON.reviver);
    } catch (e) {
      console.error(`⚠️ Imeshindwa kusoma "${key}" kutoka MongoDB:`, e.message);
      return null;
    }
  };

  const writeData = async (key, value) => {
    const serialized = JSON.parse(JSON.stringify(value, BufferJSON.replacer));
    await collection.updateOne(
      { _id: docId(key) },
      { $set: { sessionId: SESSION_ID, key, value: serialized, updatedAt: new Date() } },
      { upsert: true }
    );
  };

  const removeData = async (key) => {
    try {
      await collection.deleteOne({ _id: docId(key) });
    } catch (e) {
      // si kosa kubwa, endelea tu
    }
  };

  const existingCreds = await readData('creds');
  const creds = existingCreds || initAuthCreds();

  if (existingCreds) {
    console.log('🗄️  Session ya awali imepatikana MongoDB - inarudishwa (restore).');
  } else {
    console.log('🗄️  Hakuna session ya zamani MongoDB - itaanza mpya.');
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(key, value) : removeData(key));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: async () => writeData('creds', creds),
    clearSession: async () => {
      try {
        await collection.deleteMany({ sessionId: SESSION_ID });
        console.log('🧹 Session ya MongoDB imefutwa.');
      } catch (e) {
        console.error('Imeshindwa kufuta session ya MongoDB:', e.message);
      }
    },
    usingMongo: true
  };
}

// ---------- Njia ya 2: faili la JSON (fallback - bila .env) ----------
function clearLocalSessionFiles(sessionDir) {
  try {
    if (!fs.existsSync(sessionDir)) return;
    for (const file of fs.readdirSync(sessionDir)) {
      if (file === '.gitkeep') continue;
      fs.rmSync(path.join(sessionDir, file), { recursive: true, force: true });
    }
    console.log('🧹 Session ya faili (JSON) imefutwa.');
  } catch (e) {
    console.error('Imeshindwa kufuta session za faili:', e.message);
  }
}

async function useLocalAuthState(sessionDir) {
  await loadBaileysUtils();
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  return {
    state,
    saveCreds,
    clearSession: async () => clearLocalSessionFiles(sessionDir),
    usingMongo: false
  };
}

// ---------- Kiungo kikuu: MongoDB ikiwepo, vinginevyo JSON (haizuii bot) ----------
async function useHybridAuthState(sessionDir) {
  if (MONGODB_URI) {
    try {
      const mongoState = await useMongoAuthState();
      return mongoState;
    } catch (e) {
      console.error(
        '⚠️ Imeshindwa kuunganisha na MongoDB, bot itaendelea kutumia faili la JSON badala yake:',
        e.message
      );
    }
  } else {
    console.log('ℹ️ MONGODB_URI haijawekwa - session itahifadhiwa kwenye faili la JSON.');
  }

  return useLocalAuthState(sessionDir);
}

module.exports = { useHybridAuthState };
