const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
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
    this.isReconnecting = false;
  }

  async initialize() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    this.status = 'INITIALIZING';
    console.log('⚡ WhatsApp Bot: מאתחל חיבור...');

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
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false,
        markOnlineOnConnect: true,
        keepAliveIntervalMs: 25000,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.status = 'QR_READY';
          this.qrRaw = qr;
          console.log('\n📲 QR Code התקבל! סרוק דרך הטרמינל או עמוד הניהול.');
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
          console.log('⚠️ חיבור וואטסאפ נסגר (קוד:', statusCode, '):', lastDisconnect?.error?.message || 'ניתוק');

          this.status = 'DISCONNECTED';
          this.isReconnecting = false;

          if (shouldReconnect) {
            console.log('🔄 מתחבר מחדש אוטומטית בעוד 3 שניות...');
            setTimeout(() => this.initialize(), 3000);
          } else {
            console.log('🚪 החשבון נותק לחלוטין (Logged Out).');
            this.qrCodeDataUrl = null;
          }
        } else if (connection === 'open') {
          this.status = 'CONNECTED';
          this.qrCodeDataUrl = null;
          this.qrRaw = null;
          this.isReconnecting = false;
          console.log('✅ בוט הוואטסאפ מחובר ופעיל בהצלחה!');
        }
      });

    } catch (err) {
      console.error('Error initializing Baileys client:', err);
      this.status = 'DISCONNECTED';
      this.isReconnecting = false;
    }
  }

  async ensureConnected(maxWaitMs = 12000) {
    if (this.status === 'CONNECTED' && this.sock?.ws?.isOpen) {
      return true;
    }

    console.log('🔄 מוודא חיבור פעיל לפני פעולה...');
    if (this.status === 'DISCONNECTED') {
      this.initialize();
    }

    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      if (this.status === 'CONNECTED' && this.sock?.ws?.isOpen) {
        return true;
      }
      await new Promise(r => setTimeout(r, 500));
    }

    if (this.status !== 'CONNECTED') {
      throw new Error('חיבור הוואטסאפ מתרענן כרגע. אנא נסו שוב בעוד כמה שניות (Connection Reconnecting).');
    }
    return true;
  }

  getStatus() {
    return {
      status: this.status,
      qrCode: this.qrCodeDataUrl
    };
  }

  async requestPairingCode(rawPhone) {
    if (!this.sock) {
      await this.initialize();
    }

    let phone = rawPhone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '972' + phone.substring(1);
    }

    if (phone.length < 9) {
      throw new Error('מספר טלפון לא תקין. אנא הזינו מספר מלא, למשל 0501234567');
    }

    console.log(`📲 מבקש Pairing Code עבור מספר: ${phone}`);
    const code = await this.sock.requestPairingCode(phone);
    return code;
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
    this.isReconnecting = false;

    try {
      if (fs.existsSync(this.authDir)) {
        fs.rmSync(this.authDir, { recursive: true, force: true });
        console.log('🗑️ תיקיית ההרשאות נמחקה לחלוטין.');
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
    await this.ensureConnected();

    const groupList = await this.sock.groupFetchAllParticipating();
    const cleanSearch = groupName.trim().toLowerCase();
    const availableGroupNames = [];

    for (const [jid, group] of Object.entries(groupList)) {
      if (group.subject) {
        availableGroupNames.push(group.subject);
        if (group.subject.trim().toLowerCase().includes(cleanSearch)) {
          return jid;
        }
      }
    }

    const availableHint = availableGroupNames.length > 0
      ? `\nהקבוצות שנמצאו בחשבון: ${availableGroupNames.map(n => `"${n}"`).join(', ')}`
      : '\nלא נמצאו קבוצות בחשבון זה.';

    throw new Error(`קבוצת הוואטסאפ בשם "${groupName}" לא נמצאה.${availableHint}`);
  }

  async sendBirthdayGreeting(birthdayPerson, config) {
    await this.ensureConnected();

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

  async sendMessageToGroup(groupName, text, retryCount = 1) {
    try {
      await this.ensureConnected();
      const groupJid = await this.findGroupJidByName(groupName);

      await this.sock.sendMessage(groupJid, { text });
      console.log(`[Bot] ✅ הודעה נשלחה בהצלחה לקבוצה "${groupName}"!`);
      return true;
    } catch (err) {
      if (retryCount > 0 && (err.message.includes('Closed') || err.message.includes('disconnect') || err.message.includes('Reconnecting'))) {
        console.log('🔄 שגיאת חיבור בזמן שליחה, מנסה שוב לאחר רענון חיבור...');
        await new Promise(r => setTimeout(r, 2000));
        return await this.sendMessageToGroup(groupName, text, retryCount - 1);
      }
      throw err;
    }
  }
}

module.exports = new WhatsAppBot();
