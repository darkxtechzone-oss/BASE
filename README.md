# DarkX Tutorial Bot 🟢

Bot ndogo ya WhatsApp iliyotengenezwa kwa ajili ya **mafunzo (tutorials)**. Inaonyesha jinsi ya:

- Kuunganisha bot na WhatsApp kwa kutumia **pairing code** (bila QR)
- Kutoa pairing code kupitia **ukurasa wa web** (mtu anaweka namba yake, anapata code)
- Kutuma **picha na audio** kutoka folder la `media/`
- Kutengeneza **commands/plugins** rahisi kwa muundo wa faili tofauti

Imejengwa kwa [Baileys](https://github.com/WhiskeySockets/Baileys) + Express, tayari kwa deploy kwenye **Render**.

## 📁 Muundo wa mradi

```
darkx-tutorial-bot/
├── index.js            # Anzisha web server + WhatsApp socket
├── lib/
│   ├── whatsapp.js      # Connection logic + pairing code (direct & web)
│   └── handler.js       # Inapakia na kuendesha commands
├── commands/
│   ├── ping.js
│   ├── menu.js
│   ├── alive.js
│   └── owner.js
├── public/
│   └── index.html       # Ukurasa wa web kwa ajili ya kuweka namba na kupata pairing code
├── media/
│   ├── menu.jpg          # Picha itakayotumwa na .menu (placeholder - badilisha na yako)
│   └── menu.mp3          # Audio itakayotumwa na .menu (placeholder - badilisha na yako)
└── session/              # Hapa credentials za WhatsApp zinahifadhiwa baada ya kuunganisha
```

## 🔑 Njia mbili za kupata Pairing Code

1. **Web pairing** (default): Fungua ukurasa wa `/` (mfano `https://jina-la-app.onrender.com`), weka namba yako ya simu (na country code, bila "+"), bonyeza *"Pata pairing code"*, kisha ingiza code hiyo WhatsApp yako: **Linked Devices → Link with phone number**.
2. **Direct pairing** (terminal/log): Weka environment variable `PAIRING_NUMBER` (mfano `255712345678`) — bot itatengeneza pairing code moja kwa moja na kuionyesha kwenye console/logs.

⚠️ Baada ya kuunganisha mara moja, credentials zinahifadhiwa kwenye folder la `session/`. Usijaribu ku-pair namba nyingine bila kufuta session ya zamani kwanza.

## ▶️ Kuendesha lokali

```bash
npm install
npm start
```

Kisha fungua `http://localhost:3000` kwenye browser kupata pairing code.

## ☁️ Kudeploy kwenye Render

1. Weka mradi huu kwenye GitHub repo.
2. Render → New → Web Service → unganisha repo hii.
3. Build command: `npm install` | Start command: `npm start`.
4. (Hiari) Ongeza environment variable `PAIRING_NUMBER` ukitaka direct pairing.
5. Baada ya deploy kukamilika, fungua URL ya Render kupata ukurasa wa pairing.

**Muhimu:** Render free tier haina disk ya kudumu — ukiwa-restart/redeploy service, folder la `session/` linaweza kufutika na itabidi u-pair tena. Kwa matumizi ya kudumu, tumia [Render Persistent Disk](https://render.com/docs/disks) au hifadhi session kwenye database (mfano MongoDB).

## 🧩 Commands zilizopo

| Command   | Kazi yake                          |
|-----------|-------------------------------------|
| `.ping`   | Angalia speed ya bot                |
| `.menu`   | Onyesha menu (picha + audio + text) |
| `.alive`  | Angalia kama bot iko online          |
| `.owner`  | Taarifa za owner wa bot              |

## ➕ Kuongeza command mpya

Tengeneza faili jipya kwenye `commands/`, mfano `commands/salamu.js`:

```js
module.exports = {
  name: 'salamu',
  description: 'Tuma salamu',
  async execute(sock, msg, args, from) {
    await sock.sendMessage(from, { text: 'Mambo vipi! 👋' }, { quoted: msg });
  }
};
```

Bot itaipakia automatically wakati inapoanza (hakuna haja ya kuandika kwenye `handler.js`).

## 🖼️ Kubadilisha media ya menu

Badilisha tu faili `media/menu.jpg` na `media/menu.mp3` na zako mwenyewe — majina yabaki vilevile (`menu.jpg`, `menu.mp3`).

---

_Bot hii ilitengenezwa chini ya brand **DarkX** kwa ajili ya mafunzo._
