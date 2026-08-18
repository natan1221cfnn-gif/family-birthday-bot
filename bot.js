const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

class WhatsAppBot {
  constructor() {
    this.client = null;
    this.status = 'DISCONNECTED'; // 'DISCONNECTED', 'INITIALIZING', 'QR_READY', 'CONNECTED'
    this.qrCodeDataUrl = null;
    this.qrRaw = null;
  }

  async initialize() {
    this.status = 'INITIALIZING';
    console.log('🤖 WhatsApp Bot: מאתחל לקוח וואטסאפ...');

    const possibleChromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ];

    let chromePath = undefined;
    for (const p of possibleChromePaths) {
      if (fs.existsSync(p)) {
        chromePath = p;
        break;
      }
    }

    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: path.join(__dirname, '.wwebjs_auth')
        }),
        puppeteer: {
          headless: true,
          executablePath: chromePath,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      });

      this.client.on('qr', async (qr) => {
        this.status = 'QR_READY';
        this.qrRaw = qr;
        console.log('\n📲 QR Code התקבל! סרוק דרך הטרמינל או דרך עמוד הניהול:');
        qrcodeTerminal.generate(qr, { small: true });

        // Convert to data URL for web admin interface
        try {
          this.qrCodeDataUrl = await qrcode.toDataURL(qr);
        } catch (err) {
          console.error('Error generating QR DataURL:', err);
        }
      });

      this.client.on('ready', () => {
        this.status = 'CONNECTED';
        this.qrCodeDataUrl = null;
        this.qrRaw = null;
        console.log('✅ בוט הוואטסאפ מחובר ומוכן לפעולה!');
      });

      this.client.on('authenticated', () => {
        console.log('🔐 חיבור וואטסאפ אומת בהצלחה!');
      });

      this.client.on('auth_failure', (msg) => {
        this.status = 'DISCONNECTED';
        console.error('❌ שגיאת אימות וואטסאפ:', msg);
      });

      this.client.on('disconnected', (reason) => {
        this.status = 'DISCONNECTED';
        this.qrCodeDataUrl = null;
        console.log('⚠️ וואטסאפ התנתק:', reason);
      });

      this.client.initialize().catch((err) => {
        console.error('Error in client.initialize():', err.message);
        this.status = 'DISCONNECTED';
      });

    } catch (err) {
      console.error('Error initializing WhatsApp client:', err);
      this.status = 'DISCONNECTED';
    }
  }

  getStatus() {
    return {
      status: this.status,
      qrCode: this.qrCodeDataUrl
    };
  }

  async findChatByName(chatName) {
    if (!this.client || this.status !== 'CONNECTED') {
      throw new Error('בוט הוואטסאפ אינו מחובר כרגע');
    }

    const chats = await this.client.getChats();
    const cleanSearch = chatName.trim().toLowerCase();

    // Exact or contains match
    const found = chats.find(c => c.name && c.name.trim().toLowerCase().includes(cleanSearch));
    return found;
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

    // Handle custom wish or fallback to default wish from config
    const defaultWish = config.defaultWish || "מאחלים לך שפע של בריאות, שמחה, אהבה והגשמת כל החלומות! ✨";
    const chosenWish = (birthdayPerson.customWish && birthdayPerson.customWish.trim()) 
      ? birthdayPerson.customWish.trim() 
      : defaultWish;

    const wishText = `💬 *ברכה:* "${chosenWish}"`;

    // Build message template
    let text = config.messageTemplate || "🎉 *יום הולדת שמח!* 🎉\n\nהמון מזל טוב ל-*{name}*! 🎂🎈\n{wishText}";
    text = text.replace(/{name}/g, birthdayPerson.name);
    text = text.replace(/{ageText}/g, ageText);
    text = text.replace(/{wishText}/g, wishText);
    text = text.replace(/{customWish}/g, chosenWish);

    return await this.sendMessageToGroup(config.groupName, text);
  }

  async sendMessageToGroup(groupName, text) {
    const chat = await this.findChatByName(groupName);
    if (!chat) {
      throw new Error(`קבוצת הוואטסאפ בשם "${groupName}" לא נמצאה באנשי הקשר/קבוצות של החשבון המחובר.`);
    }

    await chat.sendMessage(text);
    console.log(`[Bot] ✅ הודעה נשלחה בהצלחה לקבוצה "${chat.name}"!`);
    return true;
  }
}

module.exports = new WhatsAppBot();
