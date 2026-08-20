const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');
const { 
  convertGregorianToHebrew, 
  convertHebrewToGregorian, 
  toGematriya,
  normalizeHebrewMonth,
  parseHebrewYear
} = require('./lib/hebrewCalendar');
const { parseHebrewDateString } = require('./lib/hebrewDateParser');

class WhatsAppBot {
  constructor() {
    this.sock = null;
    this.status = 'DISCONNECTED';
    this.qrCodeDataUrl = null;
    this.qrRaw = null;
    this.authDir = path.join(__dirname, 'auth_info_baileys');
    this.dataPath = path.join(__dirname, 'data', 'birthdays.json');
    this.configPath = path.join(__dirname, 'data', 'config.json');
    this.isReconnecting = false;
    this.userSessions = {}; // Store interactive DM conversation states
  }

  getBirthdays() {
    try {
      if (fs.existsSync(this.dataPath)) {
        return JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
      }
    } catch (e) {}
    return [];
  }

  saveBirthdays(list) {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(list, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Error saving birthdays in bot:', e);
      return false;
    }
  }

  getConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (e) {}
    return {};
  }

  async initialize() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    console.log('🤖 מאתחל את בוט הוואטסאפ...');

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['Chrome (Linux)', 'FamilyBot', '1.0.0'],
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

      // Handle Incoming Messages (Interactive DM Bot Flow)
      this.sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
          if (!messages || messages.length === 0) return;
          const msg = messages[0];
          if (!msg.message || msg.key.fromMe) return;
          
          const fromJid = msg.key.remoteJid;
          if (fromJid.endsWith('@g.us')) return; // Only handle private DMs

          const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
          if (!text) return;

          console.log(`[Bot DM] 📩 הודעה מ-${fromJid}: "${text}"`);
          await this.handleUserConversation(fromJid, text);
        } catch (err) {
          console.error('Error in messages.upsert handler:', err);
        }
      });

    } catch (err) {
      console.error('Error initializing Baileys client:', err);
      this.status = 'DISCONNECTED';
      this.isReconnecting = false;
    }
  }

  // Conversational state machine for updating birthday cards
  async handleUserConversation(fromJid, text) {
    const list = this.getBirthdays();
    let session = this.userSessions[fromJid];

    // Check for exit / cancel
    if (text === 'סיום' || text === 'ביטול' || text === 'ביי' || text === 'יציאה') {
      delete this.userSessions[fromJid];
      const byeMsg = `שמחתי לעזור! 🎉\nכל ימי ההולדת המשפחתיים מעודכנים באתר המשפחה:\n🌐 https://family-birthday-bot-obx1.onrender.com\n\nלהתראות! ✨`;
      await this.sock.sendMessage(fromJid, { text: byeMsg });
      return;
    }

    // 1. If user sent initial edit trigger e.g. "היי, אני רוצה לעדכן את כרטיסיית יום ההולדת של בדיקה טסט"
    const matchEdit = text.match(/של\s+([^\(\)]+)/i);
    let potentialName = matchEdit ? matchEdit[1].trim() : '';

    if (!session && potentialName) {
      // Find matching person
      const foundPerson = list.find(p => p.name.trim().toLowerCase() === potentialName.toLowerCase() || potentialName.includes(p.name) || p.name.includes(potentialName));
      if (foundPerson) {
        this.userSessions[fromJid] = {
          step: 'CHOOSING_OPTION',
          targetId: foundPerson.id,
          lastActive: Date.now()
        };
        await this.sendCardSummaryAndMenu(fromJid, foundPerson);
        return;
      }
    }

    // 2. If no active session
    if (!session) {
      // Try to find if user just typed a family member's name
      const found = list.find(p => p.name.trim().toLowerCase() === text.toLowerCase() || (text.length > 2 && p.name.includes(text)));
      if (found) {
        this.userSessions[fromJid] = {
          step: 'CHOOSING_OPTION',
          targetId: found.id,
          lastActive: Date.now()
        };
        await this.sendCardSummaryAndMenu(fromJid, found);
        return;
      }

      // Default welcome and prompt for name
      this.userSessions[fromJid] = { step: 'WAITING_FOR_NAME', lastActive: Date.now() };
      const welcomeMsg = `היי שלום! 🎂🎈\nשמח לעזור לך לעדכן כרטיסיית יום הולדת באתר המשפחה.\n\nאנא כתוב/כתבי לי את *השם המלא* של בן/בת המשפחה שתרצה/י לעדכן (למשל: יונתן בידה, דנה כהן):`;
      await this.sock.sendMessage(fromJid, { text: welcomeMsg });
      return;
    }

    // 3. User is in WAITING_FOR_NAME step
    if (session.step === 'WAITING_FOR_NAME') {
      const found = list.find(p => p.name.trim().toLowerCase() === text.toLowerCase() || p.name.includes(text) || text.includes(p.name));
      if (found) {
        session.step = 'CHOOSING_OPTION';
        session.targetId = found.id;
        session.lastActive = Date.now();
        await this.sendCardSummaryAndMenu(fromJid, found);
      } else {
        const notFoundMsg = `לא מצאתי כרטיסייה עבור "${text}". 🤔\nאנא וודאו שכתבתם את השם כפי שהוא מופיע באתר המשפחה:\n🌐 https://family-birthday-bot-obx1.onrender.com\n\nנסו לשלוח שוב את השם, או שלחו *סיום* לביטול.`;
        await this.sock.sendMessage(fromJid, { text: notFoundMsg });
      }
      return;
    }

    const currentPerson = list.find(p => p.id === session.targetId);
    if (!currentPerson) {
      delete this.userSessions[fromJid];
      await this.sock.sendMessage(fromJid, { text: 'הכרטיסייה לא נמצאה במערכת. אנא התחילו מחדש.' });
      return;
    }

    // 4. User is CHOOSING_OPTION (1-7)
    if (session.step === 'CHOOSING_OPTION') {
      const choice = text.replace(/[^1-7]/g, '');
      if (choice === '1') {
        session.step = 'UPDATING_NAME';
        await this.sock.sendMessage(fromJid, { text: `✏️ אנא שלח/י את *השם המלא החדש* (השם הנוכחי: ${currentPerson.name}):` });
      } else if (choice === '2') {
        session.step = 'UPDATING_GREG_DATE';
        await this.sock.sendMessage(fromJid, { text: `📅 אנא שלח/י את *התאריך הלועזי המעודכן* בפורמט יום/חודש/שנה (למשל: 15/07/1995 או 28.7.2016):` });
      } else if (choice === '3') {
        session.step = 'UPDATING_HEB_DATE';
        await this.sock.sendMessage(fromJid, { text: `📜 אנא שלח/י את *התאריך העברי המעודכן* (למשל: כ"א בתמוז תשנ"ג או ח' כסלו 2022):` });
      } else if (choice === '4') {
        session.step = 'UPDATING_REMINDER';
        await this.sock.sendMessage(fromJid, { text: `🔔 מתי תרצו לקבל את הברכה האוטומטית בוואטסאפ?\nהשב/י במספר:\n1️⃣ - בתאריך העברי 📜\n2️⃣ - בתאריך הלועזי 📅` });
      } else if (choice === '5') {
        session.step = 'UPDATING_GENDER';
        await this.sock.sendMessage(fromJid, { text: `👦/👧 מה הפנייה המתאימה?\nהשב/י במספר:\n1️⃣ - זכר (היקר שחוגג, בן X) 👦\n2️⃣ - נקבה (היקרה שחוגגת, בת X) 👧` });
      } else if (choice === '6') {
        session.step = 'UPDATING_RELATION';
        await this.sock.sendMessage(fromJid, { text: `👨‍👩‍👧 אנא שלח/י את *הקרבה במשפחה* המעודכנת (למשל: הבת של נאוה, הבן של יאיר):` });
      } else if (choice === '7') {
        session.step = 'UPDATING_WISH';
        await this.sock.sendMessage(fromJid, { text: `💬 אנא שלח/י את *נוסח האיחול / הברכה האישית* החדש:` });
      } else {
        await this.sock.sendMessage(fromJid, { text: `נא להשיב במספר בין 1 ל-7, או לשלוח *סיום*.` });
      }
      return;
    }

    // 5. Applying field updates
    const pIndex = list.findIndex(p => p.id === session.targetId);

    if (session.step === 'UPDATING_NAME') {
      list[pIndex].name = text.trim();
      this.saveBirthdays(list);
      await this.sendSuccessAndMenu(fromJid, list[pIndex], `השם עודכן ל-*${list[pIndex].name}*! ✅`);
    } else if (session.step === 'UPDATING_GREG_DATE') {
      const match = text.match(/^(\d{1,2})[\/\.](\d{1,2})(?:[\/\.](\d{2,4}))?$/);
      if (!match) {
        await this.sock.sendMessage(fromJid, { text: `פורמט תאריך לא תקין. אנא שלח/י למשל: 15/07/1995 או 15.7.1995:` });
        return;
      }
      let day = parseInt(match[1], 10);
      let month = parseInt(match[2], 10);
      let year = match[3] ? parseInt(match[3], 10) : list[pIndex].year;
      if (year && year < 100) year = year > 30 ? 1900 + year : 2000 + year;

      const hConv = convertGregorianToHebrew(day, month, year);
      list[pIndex].day = day;
      list[pIndex].month = month;
      list[pIndex].year = year || null;
      list[pIndex].hebrewDay = hConv.hebrewDay;
      list[pIndex].hebrewMonth = hConv.hebrewMonth;
      list[pIndex].hebrewDateStr = hConv.hebrewDateStr;
      list[pIndex].hebrewYear = hConv.hebrewYear || null;

      this.saveBirthdays(list);
      await this.sendSuccessAndMenu(fromJid, list[pIndex], `התאריך הלועזי עודכן ל-*${day}/${month}/${year || ''}* (עברי: ${hConv.hebrewDateStr})! ✅`);
    } else if (session.step === 'UPDATING_HEB_DATE') {
      const parsedHeb = parseHebrewDateString(text);
      if (!parsedHeb || !parsedHeb.hebrewDay || !parsedHeb.hebrewMonth) {
        await this.sock.sendMessage(fromJid, { text: `לא הצלחתי לפענח את התאריך העברי. אנא שלח/י למשל: כ"א בתמוז תשנ"ג או ח' כסלו 2022:` });
        return;
      }

      const hYear = parsedHeb.hebrewYear || list[pIndex].hebrewYear || (list[pIndex].year ? list[pIndex].year + 3760 : 5784);
      const greg = convertHebrewToGregorian(parsedHeb.hebrewDay, parsedHeb.hebrewMonth, hYear);

      list[pIndex].hebrewDay = parsedHeb.hebrewDay;
      list[pIndex].hebrewMonth = parsedHeb.hebrewMonth;
      list[pIndex].hebrewYear = parsedHeb.hebrewYear || null;
      list[pIndex].hebrewDateStr = `${toGematriya(parsedHeb.hebrewDay)} ב${parsedHeb.hebrewMonth}${parsedHeb.hebrewYear ? ' ' + toGematriya(parsedHeb.hebrewYear) : ''}`;
      list[pIndex].day = greg.day;
      list[pIndex].month = greg.month;
      if (parsedHeb.hebrewYear) list[pIndex].year = greg.year;

      this.saveBirthdays(list);
      await this.sendSuccessAndMenu(fromJid, list[pIndex], `התאריך העברי עודכן ל-*${list[pIndex].hebrewDateStr}* (לועזי: ${greg.day}/${greg.month}/${greg.year || ''})! ✅`);
    } else if (session.step === 'UPDATING_REMINDER') {
      if (text.includes('1') || text.includes('עברי')) {
        list[pIndex].reminderType = 'hebrew';
      } else {
        list[pIndex].reminderType = 'gregorian';
      }
      this.saveBirthdays(list);
      await this.sendSuccessAndMenu(fromJid, list[pIndex], `העדפת התזכורת עודכנה ל-*${list[pIndex].reminderType === 'hebrew' ? 'תאריך עברי 📜' : 'תאריך לועזי 📅'}*! ✅`);
    } else if (session.step === 'UPDATING_GENDER') {
      if (text.includes('2') || text.includes('נקבה') || text.includes('בת')) {
        list[pIndex].gender = 'female';
      } else {
        list[pIndex].gender = 'male';
      }
      this.saveBirthdays(list);
      await this.sendSuccessAndMenu(fromJid, list[pIndex], `הפנייה עודכנה ל-*${list[pIndex].gender === 'female' ? 'נקבה (היקרה שחוגגת) 👧' : 'זכר (היקר שחוגג) 👦'}*! ✅`);
    } else if (session.step === 'UPDATING_RELATION') {
      list[pIndex].relation = text.trim();
      this.saveBirthdays(list);
      await this.sendSuccessAndMenu(fromJid, list[pIndex], `הקרבה במשפחה עודכנה ל-*${list[pIndex].relation}*! ✅`);
    } else if (session.step === 'UPDATING_WISH') {
      list[pIndex].customWish = text.trim();
      this.saveBirthdays(list);
      await this.sendSuccessAndMenu(fromJid, list[pIndex], `נוסח הברכה עודכן בהצלחה! ✅`);
    }

    session.step = 'CHOOSING_OPTION';
  }

  async sendCardSummaryAndMenu(fromJid, person) {
    const genderText = person.gender === 'female' ? '👧 נקבה (היקרה שחוגגת)' : '👦 זכר (היקר שחוגג)';
    const reminderText = person.reminderType === 'hebrew' ? 'לפי תאריך עברי 📜' : 'לפי תאריך לועזי 📅';

    const menu = `היי שלום! 🎂✨
שמח לעזור לך לעדכן את הכרטיסייה של *${person.name}*!

📋 *הפרטים הנוכחיים:*
• 👤 *שם מלא:* ${person.name}
• *פנייה/מגדר:* ${genderText}
• 📅 *תאריך לועזי:* ${person.day}/${person.month}${person.year ? '/' + person.year : ''}
• 📜 *תאריך עברי:* ${person.hebrewDateStr || 'לא הוגדר'}
• 🔔 *העדפת תזכורת:* ${reminderText}
• 👨‍👩‍👧 *קרבה במשפחה:* ${person.relation || 'משפחה'}
• 💬 *איחול אישי:* "${person.customWish || 'מאחלים לך שפע בריאות ושמחה!'}"

────────────────────────
*מה תרצה/י לעדכן? (השב/י במספר):*
1️⃣ - עדכון שם מלא
2️⃣ - עדכון תאריך לועזי (יום/חודש/שנה)
3️⃣ - עדכון תאריך עברי (יום/חודש/שנה)
4️⃣ - שינוי העדפת תזכורת (עברי / לועזי)
5️⃣ - שינוי פנייה (זכר / נקבה)
6️⃣ - עדכון קרבה במשפחה
7️⃣ - עדכון איחול / ברכה אישית

*(ניתן לשלוח "סיום" בכל שלב)*`;

    await this.sock.sendMessage(fromJid, { text: menu });
  }

  async sendSuccessAndMenu(fromJid, person, updateNotice) {
    const msg = `${updateNotice}

🔗 *לצפייה בכרטיסייה המעודכנת באתר המשפחה:*
https://family-birthday-bot-obx1.onrender.com

────────────────────────
רוצים לעדכן שדה נוסף?
השיבו במספר (1-7), או השיבו *סיום* לסיום השיחה. 😊`;

    await this.sock.sendMessage(fromJid, { text: msg });
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

    console.log(`🔍 מחפש את הקבוצה "${groupName}"...`);
    const chats = await this.sock.groupFetchAllParticipating();
    const groupList = Object.values(chats);

    const targetGroup = groupList.find(g => 
      g.subject && g.subject.trim().toLowerCase() === groupName.trim().toLowerCase()
    );

    if (!targetGroup) {
      const availableGroups = groupList.map(g => `"${g.subject}"`).join(', ');
      throw new Error(`הקבוצה "${groupName}" לא נמצאה בחשבון הוואטסאפ המחובר. הקבוצות שנמצאו: ${availableGroups || 'אין קבוצות'}`);
    }

    return targetGroup.id;
  }

  formatGreetingMessage(template, person) {
    const isFemale = person.gender === 'female';
    const relationStr = person.relation ? ` (${person.relation})` : '';
    const celebrantName = `${person.name}${relationStr}`;

    let ageText = '';
    if (person.year) {
      const thisYear = new Date().getFullYear();
      const age = thisYear - person.year;
      if (age > 0) {
        ageText = isFemale ? `בת ${age}` : `בן ${age}`;
      }
    }

    const defaultTemplate = 
`🎉 *יום הולדת שמח!* 🎉

המון מזל טוב *ל${person.name}* ${isFemale ? 'היקרה שחוגגת' : 'היקר שחוגג'} היום יום הולדת${ageText ? ' ' + ageText : ''}! 🎂🎈

💬 *ברכה:*
"{wishText}"

אוהבים ומאחלים מכל הלב, המשפחה! 💐🥰`;

    let msg = template && template.trim() ? template : defaultTemplate;

    msg = msg.replace(/\{name\}/g, celebrantName);
    msg = msg.replace(/\{ageText\}/g, ageText);
    msg = msg.replace(/\{wishText\}/g, person.customWish || 'מאחלים לך שפע של בריאות, שמחה, אהבה והגשמת כל החלומות! ✨');

    return msg;
  }

  async sendBirthdayGreeting(person, config) {
    await this.ensureConnected();

    const groupName = config.groupName;
    if (!groupName) {
      throw new Error('שם הקבוצה לא מוגדר בהגדרות');
    }

    const groupJid = await this.findGroupJidByName(groupName);
    const messageText = this.formatGreetingMessage(config.messageTemplate, person);

    console.log(`📤 שולח ברכת יום הולדת ל-${person.name} בקבוצה "${groupName}"...`);
    await this.sock.sendMessage(groupJid, { text: messageText });
    console.log(`✅ ברכה נשלחה בהצלחה ל-${person.name}!`);

    return true;
  }
}

module.exports = new WhatsAppBot();
