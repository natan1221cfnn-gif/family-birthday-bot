const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

class WhatsAppBot {
  constructor() {
    this.sock = null;
    this.status = 'DISCONNECTED'; // 'DISCONNECTED', 'INITIALIZING', 'QR_READY', 'CONNECTED'
    this.qrCodeDataUrl = null;
    this.qrRaw = null;
    this.authDir = path.join(__dirname, '.baileys_auth');
  }

  async initialize() {
    this.status = 'INITIALIZING';
    console.log('⚡ WhatsApp Bot (Baileys Engine): מאתחל חיבור סופר-מהיר...');

    try {
      if (!fs.existsSync(this.authDir)) {
        fs.mkdirSync(this.authDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['Family Birthday Hub', 'Chrome', '1.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.status = 'QR_READY';
          this.qrRaw = qr;
          console.log('\n📲 QR Code התקבל תוך שבריר שניה! סרוק דרך הטרמינל או דרך עמוד הניהול:');
          qrcodeTerminal.generate(qr, { small: true });

          try {
            this.qrCodeDataUrl = await qrcode.toDataURL(qr);
          } catch (err) {
            console.error('Error generating QR DataURL:', err);
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          console.log('⚠️ חיבור וואטסאפ נסגר:', lastDisconnect?.error?.message || 'ניתוק');

          if (shouldReconnect) {
            console.log('🔄 מתחבר מחדש אוטומטית...');
            setTimeout(() => this.initialize(), 3000);
          } else {
            this.status = 'DISCONNECTED';
            this.qrCodeDataUrl = null;
          }
        } else if (connection === 'open') {
          this.status = 'CONNECTED';
          this.qrCodeDataUrl = null;
          this.qrRaw = null;
          console.log('✅ בוט הוואטסאפ מחובר בהצלחה (Baileys Engine)!');
        }
      });

    } catch (err) {
      console.error('Error initializing Baileys client:', err);
      this.status = 'DISCONNECTED';
    }
  }

  getStatus() {
    return {
      status: this.status,
      qrCode: this.qrCodeDataUrl
    };
  }

  async logoutAndWipeSession() {
    console.log('🧹 מתחיל ניתוק ומחיקה מלאה של נתוני הוואטסאפ...');
    try {
      if (this.sock) {
        try {
          await this.sock.logout();
        } catch (e) {}
        try {
          this.sock.end();
        } catch (e) {}
      }
    } catch (err) {}

    this.sock = null;
    this.status = 'DISCONNECTED';
    this.qrCodeDataUrl = null;
    this.qrRaw = null;

    try {
      if (fs.existsSync(this.authDir)) {
        fs.rmSync(this.authDir, { recursive: true, force: true });
        console.log('🗑️ תיקיית ההרשאות .baileys_auth נמחקה לחלוטין.');
      }
    } catch (err) {
      console.error('Error deleting session folder:', err.message);
    }

    setTimeout(() => {
      this.initialize().catch(err => console.error('Error reinitializing bot:', err));
    }, 1000);

    return true;
  }

  async findGroupJidByName(groupName) {
    if (!this.sock || this.status !== 'CONNECTED') {
      throw new Error('בוט הוואטסאפ אינו מחובר כרגע');
    }

    const groupList = await this.sock.groupFetchAllParticipating();
    const cleanSearch = groupName.trim().toLowerCase();

    for (const [jid, group] of Object.entries(groupList)) {
      if (group.subject && group.subject.trim().toLowerCase().includes(cleanSearch)) {
        return jid;
      }
    }

    return null;
  }

  async sendBirthdayGreeting(birthdayPerson, config) {
    if (this.status !== 'CONNECTED') {
      console.warn(`[Bot] דילוג על שליחה ל-${birthdayPerson.name}: הבוט אינו מחובר.`);
      return false;
    }

    const currentYear = new Date().getFullYear();
    let ageText = '';
    if (birthdayPerson.year) {
      const age = currentYear - birthdayPerson.year;
      ageText = ` ${age}`;
    }

    const defaultWish = config.defaultWish || "מאחלים לך שפע של בריאות, שמחה, אהבה והגשמת כל החלומות! ✨";
    const chosenWish = (birthdayPerson.customWish && birthdayPerson.customWish.trim()) 
      ? birthdayPerson.customWish.trim() 
      : defaultWish;

    const wishText = `💬 *ברכה:* "${chosenWish}"`;

    let text = config.messageTemplate || "🎉 *יום הולדת שמח!* 🎉\n\nהמון מזל טוב ל-*{name}*! 🎂🎈\n{wishText}";
    text = text.replace(/{name}/g, birthdayPerson.name);
    text = text.replace(/{ageText}/g, ageText);
    text = text.replace(/{wishText}/g, wishText);
    text = text.replace(/{customWish}/g, chosenWish);

    return await this.sendMessageToGroup(config.groupName, text);
  }

  async sendMessageToGroup(groupName, text) {
    const groupJid = await this.findGroupJidByName(groupName);
    if (!groupJid) {
      throw new Error(`קבוצת הוואטסאפ בשם "${groupName}" לא נמצאה בחשבון המחובר.`);
    }

    await this.sock.sendMessage(groupJid, { text });
    console.log(`[Bot] ✅ הודעה נשלחה בהצלחה לקבוצה "${groupName}"!`);
    return true;
  }
}

module.exports = new WhatsAppBot();
