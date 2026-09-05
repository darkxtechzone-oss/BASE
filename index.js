const express = require('express');
const path = require('path');
const { startSock, getPairingCodeForNumber, getStatus } = require('./lib/whatsapp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint ya kuomba pairing code kupitia namba ya simu (web pairing)
app.post('/api/pair', async (req, res) => {
  const { number } = req.body;

  if (!number) {
    return res.status(400).json({ error: 'Tafadhali weka namba ya simu. Mfano: 255712345678' });
  }

  try {
    const code = await getPairingCodeForNumber(number);
    return res.json({ code });
  } catch (err) {
    console.error('Pairing error:', err.message);
    return res.status(500).json({ error: err.message || 'Imeshindwa kupata pairing code.' });
  }
});

// Endpoint ndogo ya kuangalia status ya connection
app.get('/api/status', (req, res) => {
  res.json({ status: getStatus() });
});

app.get('/health', (req, res) => res.send('DarkX Tutorial Bot 🟢 iko hai'));

app.listen(PORT, () => {
  console.log(`🌐 Web pairing UI inapatikana: http://localhost:${PORT}`);
});

// Anzisha connection ya WhatsApp. Ikiwa haijasajiliwa bado (registered=false),
// bot itasubiri hadi mtu aweke namba yake kupitia ukurasa wa web (/) ili kupata pairing code.
startSock().catch((err) => {
  console.error('Imeshindwa kuanzisha WhatsApp socket:', err);
});
