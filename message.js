// message.js
//
// FAILI HII NI MPYA - inasoma na kuendesha commands kupitia mfumo wa
// "plugins" (kila command ni faili moja kwenye folder ya plugins/).
// Imetoholewa kutoka kwenye mfumo wa WA-BASE-BOT (message.js), lakini
// haihusiani na connection/session - ile inabaki ile ile ya awali
// (lib/whatsapp.js).

const config = require('./settings/config');
const fs = require('fs');
const path = require('path');
const os = require('os');

let jidNormalizedUser, getContentType;

const loadBaileysUtils = async () => {
  const baileys = await import('@whiskeysockets/baileys');
  jidNormalizedUser = baileys.jidNormalizedUser;
  getContentType = baileys.getContentType;
};

// ---------- Plugin Loader ----------
class PluginLoader {
  constructor() {
    this.plugins = new Map();
    this.categories = new Map();
    this.pluginsDir = path.join(__dirname, 'plugins');
    this.defaultCategories = {
      ai: '🤖 AI MENU',
      downloader: '📥 DOWNLOAD MENU',
      fun: '🎮 FUN MENU',
      general: '⚡ GENERAL MENU',
      group: '👥 GROUP MENU',
      owner: '👑 OWNER MENU',
      other: '📦 OTHER MENU',
      tools: '🛠️ TOOLS MENU',
      video: '🎬 VIDEO MENU'
    };
    this.loadPlugins();
  }

  loadPlugins() {
    try {
      if (!fs.existsSync(this.pluginsDir)) {
        fs.mkdirSync(this.pluginsDir, { recursive: true });
        console.log('📁 Folder ya plugins imetengenezwa');
        return;
      }

      const pluginFiles = fs.readdirSync(this.pluginsDir).filter((file) => file.endsWith('.js') && !file.startsWith('_'));

      this.plugins.clear();
      this.categories.clear();
      Object.keys(this.defaultCategories).forEach((cat) => this.categories.set(cat, []));

      for (const file of pluginFiles) {
        try {
          const pluginPath = path.join(this.pluginsDir, file);
          const plugin = require(pluginPath);

          if (plugin.command && typeof plugin.execute === 'function') {
            if (!plugin.category) plugin.category = 'general';
            if (!this.categories.has(plugin.category)) this.categories.set(plugin.category, []);

            this.plugins.set(plugin.command, plugin);
            this.categories.get(plugin.category).push(plugin.command);
            console.log(`✅ Command imepakiwa: .${plugin.command} (${plugin.category})`);
          } else {
            console.log(`⚠️  Muundo mbaya kwenye plugin: ${file}`);
          }
        } catch (error) {
          console.log(`❌ Imeshindwa kupakia plugin ${file}:`, error.message);
        }
      }

      console.log(`📦 Jumla ya commands ${this.plugins.size} kwenye makundi ${this.categories.size}`);
    } catch (error) {
      console.log('❌ Kosa kupakia plugins:', error.message);
    }
  }

  async executePlugin(command, sock, m, ctx) {
    const plugin = this.plugins.get(command);
    if (!plugin) return false;

    try {
      if (plugin.owner && !ctx.isCreator) return true;
      if (plugin.group && !m.isGroup) return true;
      if (plugin.admin && m.isGroup && !ctx.isAdmins && !ctx.isCreator) return true;

      await plugin.execute(sock, m, ctx);
      return true;
    } catch (error) {
      console.log(`❌ Kosa kwenye command .${command}:`, error);
      return true;
    }
  }

  getPluginCount() {
    let count = 0;
    for (const commands of this.categories.values()) count += commands.length;
    return count;
  }

  getMenuSections() {
    const sections = [];
    const sortedCategories = Array.from(this.categories.entries())
      .filter(([category, commands]) => commands.length > 0 && this.defaultCategories[category])
      .sort(([catA], [catB]) => this.defaultCategories[catA].localeCompare(this.defaultCategories[catB]));

    for (const [category, commands] of sortedCategories) {
      const categoryName = this.defaultCategories[category];
      const commandList = commands
        .sort()
        .map((cmd) => {
          const plugin = this.plugins.get(cmd);
          return `︱✗ ${cmd}${plugin.description ? ` - ${plugin.description}` : ''}`;
        })
        .join('\n');
      sections.push(`╾─╼▣ ${categoryName}\n${commandList}\n╿─╼▣`);
    }
    return sections.join('\n\n');
  }

  reloadPlugins() {
    const pluginFiles = fs.readdirSync(this.pluginsDir).filter((file) => file.endsWith('.js') && !file.startsWith('_'));
    for (const file of pluginFiles) {
      const pluginPath = path.join(this.pluginsDir, file);
      delete require.cache[require.resolve(pluginPath)];
    }
    this.loadPlugins();
  }
}

const pluginLoader = new PluginLoader();

module.exports = async (sock, m, chatUpdate, store) => {
  try {
    if (!jidNormalizedUser || !getContentType) await loadBaileysUtils();
    if (!m || !m.message) return;

    const body = m.body || m.text || '';
    const sender = m.sender;
    const senderNumber = (sender || '').split('@')[0];
    const prefa = ['', '!', '.', ',', '🤖', '🗿'];

    const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤Ω Φ_&><`™©®Δ^βα~¦|/\\©^]/;
    const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.';
    const from = m.chat;
    const botNumber = sock.decodeJid(sock.user.id);
    const isCmd = body.startsWith(prefix);
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);
    const pushname = m.pushName || 'No Name';
    const text = (args || []).join(' ');
    const quoted = m.quoted ? m.quoted : m;
    const mime = (quoted.msg || quoted).mimetype || '';
    const qmsg = quoted.msg || quoted;
    const isMedia = /image|video|sticker|audio/.test(mime);

    const groupMetadata = m.isGroup ? await sock.groupMetadata(m.chat).catch(() => ({})) : {};
    const groupName = m.isGroup ? groupMetadata.subject || '' : '';
    const participants = m.isGroup
      ? (groupMetadata.participants || []).map((p) => ({
          id: p.id || null,
          admin: p.admin === 'superadmin' ? 'superadmin' : p.admin === 'admin' ? 'admin' : null,
          full: p
        }))
      : [];
    const groupOwner = m.isGroup ? groupMetadata.owner || '' : '';
    const groupAdmins = participants.filter((p) => p.admin === 'admin' || p.admin === 'superadmin').map((p) => p.id);
    const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false;
    const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;
    const isGroupOwner = m.isGroup ? groupOwner === m.sender : false;
    const isCreator = jidNormalizedUser(m.sender) === jidNormalizedUser(botNumber) || m.fromMe;

    if (isCmd) {
      console.log('# Ujumbe Mpya');
      console.log(`- Tarehe   : ${new Date().toLocaleString()}`);
      console.log(`- Command  : ${command}`);
      console.log(`- Sender   : ${pushname} (${senderNumber})`);
    }

    async function reply(text) {
      return sock.sendMessage(
        m.chat,
        {
          text,
          contextInfo: {
            mentionedJid: [sender],
            externalAdReply: {
              title: config.settings.title,
              body: config.settings.description,
              thumbnailUrl: config.thumbUrl,
              renderLargerThumbnail: false
            }
          }
        },
        { quoted: m }
      );
    }

    const ctx = {
      args,
      text,
      q: text,
      quoted,
      mime,
      qmsg,
      isMedia,
      groupMetadata,
      groupName,
      participants,
      groupOwner,
      groupAdmins,
      isBotAdmins,
      isAdmins,
      isGroupOwner,
      isCreator,
      prefix,
      reply,
      config,
      sender
    };

    const pluginExecuted = await pluginLoader.executePlugin(command, sock, m, ctx);
    if (pluginExecuted) return;

    switch (command) {
      case 'menu': {
        const usedMem = process.memoryUsage().heapUsed / 1024 / 1024;
        const totalMem = os.totalmem() / 1024 / 1024 / 1024;
        const uptimeSec = process.uptime();
        const days = Math.floor(uptimeSec / (3600 * 24));
        const hours = Math.floor((uptimeSec % (3600 * 24)) / 3600);
        const minutes = Math.floor((uptimeSec % 3600) / 60);
        const seconds = Math.floor(uptimeSec % 60);
        const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        const ping = Date.now() - m.messageTimestamp * 1000;
        const host = os.platform();
        const mode = sock.public ? 'Public' : 'Self';

        const pluginMenuSections = pluginLoader.getMenuSections();
        const totalCommands = pluginLoader.getPluginCount();

        const menuText = `╔〘 *${config.settings.title}*
║ 👤 Owner  : ${config.owner}
║ 🧩 Prefix : [ . ]
║ 🖥️ Host   : ${host}
║ 🧠 Commands: ${totalCommands}
║ ⚙️ Mode   : ${mode}
║ ⏱️ Uptime : ${uptime}
║ ⚡ Ping   : ${ping.toFixed(0)} ms
║ 📊 RAM    : ${usedMem.toFixed(2)} MB / ${totalMem.toFixed(2)} GB
╚═〘 System Status

${pluginMenuSections}`;

        await sock.sendMessage(
          m.chat,
          {
            image: { url: config.thumbUrl },
            caption: menuText,
            contextInfo: { mentionedJid: [m.sender] }
          },
          { quoted: m }
        );
        break;
      }

      case 'reload': {
        if (!isCreator) return;
        pluginLoader.reloadPlugins();
        await reply(`✅ Plugins zime-reload! Jumla commands ${pluginLoader.getPluginCount()}.`);
        break;
      }

      // Hakuna default - inabaki kimya kwa command isiyojulikana
    }
  } catch (err) {
    console.log('message.js error:', err);
  }
};
