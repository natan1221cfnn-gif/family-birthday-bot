const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { 
  convertGregorianToHebrew, 
  convertHebrewToGregorian, 
  normalizeHebrewMonth, 
  parseHebrewYear,
  toGematriya
} = require('./lib/hebrewCalendar');
const bot = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const BIRTHDAYS_FILE = path.join(DATA_DIR, 'birthdays.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Middleware
app.use(cors());
app.use(express.json());

// Disable caching for all API responses to ensure real-time updates
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

const DEFAULT_FAMILY_BIRTHDAYS = [
  { name: "ורד דידי", relation: "הבת של נאוה", gender: "female", day: 27, month: 6, year: 1990, reminderType: "gregorian" },
  { name: "יוסי דידי", relation: "בעלה של ורד (הבת של נאוה)", gender: "male", day: 2, month: 4, year: 1991, reminderType: "gregorian" },
  { name: "ציון טהרני", relation: "משפחה", gender: "male", day: 7, month: 7, year: 1992, reminderType: "hebrew" },
  { name: "פנינה טהרני", relation: "הבת של נאוה", gender: "female", day: 21, month: 3, year: 1993, reminderType: "gregorian" },
  { name: "דנה כהן", relation: "הבת של נופת", gender: "female", day: 10, month: 7, year: 1993, reminderType: "hebrew" },
  { name: "יאיר עג'מי", relation: "הבן של ניצה", gender: "male", day: 20, month: 5, year: 1998, reminderType: "hebrew" },
  { name: "אודיה עג'מי", relation: "אשתו של יאיר (הבן של ניצה)", gender: "female", day: 4, month: 9, year: 1999, reminderType: "hebrew" },
  { name: "תמר דידי", relation: "הבת של ורד (הבת של נאוה)", gender: "female", day: 29, month: 10, year: 2013, reminderType: "gregorian" },
  { name: "יאיר דידי", relation: "הבן של ורד (הבת של נאוה)", gender: "male", day: 28, month: 7, year: 2016, reminderType: "gregorian" },
  { name: "עדי דידי", relation: "הבת של ורד (הבת של נאוה)", gender: "female", day: 23, month: 4, year: 2019, reminderType: "gregorian" },
  { name: "נועה דידי", relation: "הבת של ורד (הבת של נאוה)", gender: "female", day: 17, month: 1, year: 2022, reminderType: "gregorian" },
  { name: "הללי עג'מי", relation: "הבת של יאיר (הבן של ניצה)", gender: "female", day: 28, month: 7, year: 2022, reminderType: "hebrew" },
  { name: "הראל דידי", relation: "הבן של ורד (הבת של נאוה)", gender: "male", day: 18, month: 6, year: 2025, reminderType: "gregorian" },
  { name: "הדס דידי", relation: "הבת של ורד (הבת של נאוה)", gender: "female", day: 18, month: 6, year: 2025, reminderType: "gregorian" },
  { name: "אליה עג'מי", relation: "הבן של יאיר (הבן של ניצה)", gender: "male", day: 15, month: 9, year: 2025, reminderType: "hebrew" },
  { name: "אריאל דוד יצחקוב", relation: "הבן של נופת", gender: "male", day: 7, month: 6, year: 2010, reminderType: "hebrew" },
  { name: "אלעזר אוריין", relation: "בעלה של יסכה (הבת של ניצה)", gender: "male", day: 17, month: 11, year: 2003, reminderType: "hebrew" },
  { name: "יסכה אוריין", relation: "הבת של ניצה", gender: "female", day: 21, month: 4, year: 2003, reminderType: "hebrew" },
  { name: "עמוס כהן", relation: "בעלה של דנה (הבת של נופת)", gender: "male", day: 30, month: 12, year: 1992, reminderType: "hebrew" },
  { name: "יעל כהן", relation: "הבת של דנה (הבת של נופת)", gender: "female", day: 19, month: 10, year: 2022, reminderType: "hebrew" },
  { name: "יסכה כהן", relation: "הבת של דנה (הבת של נופת)", gender: "female", day: 1, month: 2, year: 2025, reminderType: "hebrew" },
  { name: "נעם עג'מי", relation: "הבן של ניצה", gender: "male", day: 12, month: 6, year: 1995, reminderType: "hebrew" },
  { name: "אוריה עג'מי", relation: "אשתו של נעם", gender: "female", day: 3, month: 3, year: 1995, reminderType: "hebrew" },
  { name: "רני עג'מי", relation: "הבת של נעם ואוריה", gender: "female", day: 25, month: 6, year: 2026, reminderType: "hebrew" },
  { name: "זגדון יקירה", relation: "אשת אלישע", gender: "female", day: 24, month: 11, reminderType: "hebrew" },
  { name: "יערה זגדון", relation: "הבת של אלישע", gender: "female", day: 25, month: 1, reminderType: "hebrew" },
  { name: "אמיר זגדון", relation: "בן של אלישע", gender: "male", day: 16, month: 1, reminderType: "hebrew" },
  { name: "אלישע זגדון", relation: "בן של סבתא רחל וסבא כדיר", gender: "male", day: 1, month: 10, reminderType: "hebrew" }
].map((m, idx) => {
  const hebInfo = convertGregorianToHebrew(m.day, m.month, m.year);
  return {
    id: `bday_${idx + 1}_${m.name.replace(/\s+/g, '_')}`,
    name: m.name,
    gender: m.gender || 'unspecified',
    day: m.day,
    month: m.month,
    year: m.year || undefined,
    hebrewDay: hebInfo.hebrewDay,
    hebrewMonth: hebInfo.hebrewMonth,
    hebrewMonthName: hebInfo.hebrewMonthName,
    hebrewDateStr: hebInfo.hebrewDateStr,
    hebrewYear: hebInfo.hebrewYear,
    reminderType: m.reminderType || 'gregorian',
    relation: m.relation,
    customWish: "",
    createdAt: new Date().toISOString()
  };
});

// Helpers to read/write JSON files safely
function getBirthdays() {
  try {
    if (!fs.existsSync(BIRTHDAYS_FILE)) {
      saveBirthdays(DEFAULT_FAMILY_BIRTHDAYS);
      return DEFAULT_FAMILY_BIRTHDAYS;
    }
    const data = fs.readFileSync(BIRTHDAYS_FILE, 'utf8');
    const parsed = JSON.parse(data || '[]');
    if (parsed.length === 0) {
      saveBirthdays(DEFAULT_FAMILY_BIRTHDAYS);
      return DEFAULT_FAMILY_BIRTHDAYS;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading birthdays.json:', err);
    return DEFAULT_FAMILY_BIRTHDAYS;
  }
}

function saveBirthdays(list) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(BIRTHDAYS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function getConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return {
        groupName: "משפחה",
        notificationHour: 8,
        notificationMinute: 30,
        messageTemplate: "🎉 *יום הולדת שמח!* 🎉\n\nהמון מזל טוב *ל{name}* {greetingHonor} יום הולדת{ageText}! 🎂🎈\n\n{wishText}\n\nאוהבים ומאחלים מכל הלב,\nהמשפחה! 💐🥰",
        adminPin: "natan1221"
      };
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading config.json:', err);
    return {};
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

// ----------------------------------------------------
// Public APIs
// ----------------------------------------------------

// Get public config (default wish, etc.)
app.get('/api/public-config', (req, res) => {
  const config = getConfig();
  res.json({
    defaultWish: config.defaultWish || "מאחלים לך שפע של בריאות, שמחה, אהבה והגשמת כל החלומות! ✨"
  });
});

// Get all birthdays
app.get('/api/birthdays', (req, res) => {
  const list = getBirthdays();
  res.json(list);
});

// Add a new birthday from the landing page
app.post('/api/birthdays', (req, res) => {
  try {
    const { 
      name, 
      dateType, 
      day, 
      month, 
      hebrewDay, 
      hebrewMonth, 
      gender, 
      reminderType, 
      relation, 
      customWish 
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'נא להזין שם' });
    }

    let finalDay = day ? parseInt(day, 10) : null;
    let finalMonth = month ? parseInt(month, 10) : null;

    let finalHebDay = hebrewDay ? parseInt(hebrewDay, 10) : null;
    let finalHebMonth = hebrewMonth || null;
    let finalHebDateStr = '';

    // If user entered Hebrew date
    if (dateType === 'hebrew' && finalHebDay && finalHebMonth) {
      const gregInfo = convertHebrewToGregorian(finalHebDay, finalHebMonth, 5784);
      finalDay = gregInfo.day;
      finalMonth = gregInfo.month;
      finalHebDateStr = `${toGematriya(finalHebDay)} ב${finalHebMonth}`;
    } else if (finalDay && finalMonth) {
      // User entered Gregorian date -> calculate Hebrew
      const hebInfo = convertGregorianToHebrew(finalDay, finalMonth, 2024);
      finalHebDay = hebInfo.hebrewDay;
      finalHebMonth = hebInfo.hebrewMonth;
      finalHebDateStr = hebInfo.hebrewDateStr;
    } else {
      return res.status(400).json({ message: 'נא לבחור תאריך יום הולדת תקין' });
    }

    const list = getBirthdays();
    const config = getConfig();
    const fallbackWish = config.defaultWish || "מאחלים לך שפע של בריאות, שמחה, אהבה והגשמת כל החלומות! ✨";

    const newEntry = {
      id: 'bday_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      gender: gender || 'unspecified',
      day: finalDay,
      month: finalMonth,
      hebrewDay: finalHebDay,
      hebrewMonth: finalHebMonth,
      hebrewDateStr: finalHebDateStr,
      reminderType: reminderType || (dateType === 'hebrew' ? 'hebrew' : 'gregorian'),
      relation: relation ? relation.trim() : '',
      customWish: (customWish && customWish.trim()) ? customWish.trim() : fallbackWish,
      createdAt: new Date().toISOString()
    };

    list.push(newEntry);
    saveBirthdays(list);

    console.log(`[API] 🎉 יום הולדת חדש נוסף: ${newEntry.name} (${newEntry.day}/${newEntry.month} | ${newEntry.hebrewDateStr})`);
    res.status(201).json({ message: 'נוסף בהצלחה', entry: newEntry });
  } catch (err) {
    console.error('Error in POST /api/birthdays:', err);
    res.status(500).json({ message: err.message || 'שגיאה פנימית בשמירת יום ההולדת', error: err.toString() });
  }
});

// ----------------------------------------------------
// Admin APIs
// ----------------------------------------------------

// Simple Admin Auth
app.post('/api/admin/auth', (req, res) => {
  const { pin } = req.body;
  const config = getConfig();

  if (pin === (config.adminPin || '1234')) {
    // Return simple token
    const token = 'admin_session_' + Date.now();
    return res.json({ success: true, token });
  }

  return res.status(401).json({ message: 'קוד PIN שגוי' });
});

// Admin Middleware check
function checkAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer admin_session_')) {
    return res.status(403).json({ message: 'לא מורשה' });
  }
  next();
}

// Get Config
app.get('/api/admin/config', checkAuth, (req, res) => {
  const config = getConfig();
  res.json(config);
});

// Save Config
app.post('/api/admin/config', checkAuth, (req, res) => {
  const { groupName, notificationHour, notificationMinute, messageTemplate, defaultWish } = req.body;
  const current = getConfig();

  current.groupName = groupName || current.groupName;
  current.notificationHour = notificationHour !== undefined ? notificationHour : current.notificationHour;
  current.notificationMinute = notificationMinute !== undefined ? notificationMinute : current.notificationMinute;
  current.messageTemplate = messageTemplate !== undefined ? messageTemplate : current.messageTemplate;
  current.defaultWish = defaultWish !== undefined ? defaultWish : current.defaultWish;

  saveConfig(current);
  scheduleDailyJob(); // Reschedule with new time

  res.json({ message: 'הגדרות נשמרו בהצלחה', config: current });
});

// Bot Status
app.get('/api/admin/bot-status', checkAuth, (req, res) => {
  res.json(bot.getStatus());
});

// Restart Bot / Request fresh QR
app.post('/api/admin/bot-restart', checkAuth, async (req, res) => {
  try {
    console.log('🔄 מפעיל מחדש את לקוח הוואטסאפ...');
    await bot.initialize();
    res.json({ message: 'מאתחל את לקוח הוואטסאפ...' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'שגיאה באתחול' });
  }
});

// Request 8-character Pairing Code
app.post('/api/admin/request-pairing-code', checkAuth, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'נא להזין מספר טלפון' });

    const code = await bot.requestPairingCode(phone);
    res.json({ success: true, code });
  } catch (err) {
    res.status(500).json({ message: err.message || 'שגיאה ביצירת קוד קישור' });
  }
});

// Bulk set / seed birthdays
app.post('/api/admin/set-birthdays', checkAuth, (req, res) => {
  const { birthdays } = req.body;
  if (!Array.isArray(birthdays)) {
    return res.status(400).json({ message: 'רשימת ימי הולדת לא תקינה' });
  }
  saveBirthdays(birthdays);
  res.json({ message: `נשמרו בהצלחה ${birthdays.length} ימי הולדת בשרת! 🎉`, count: birthdays.length });
});

// Force re-seed default family members
app.post('/api/admin/reseed', checkAuth, (req, res) => {
  saveBirthdays(DEFAULT_FAMILY_BIRTHDAYS);
  res.json({ message: `נטענו בהצלחה ${DEFAULT_FAMILY_BIRTHDAYS.length} בני המשפחה מהטבלה! ✅`, count: DEFAULT_FAMILY_BIRTHDAYS.length });
});

// Logout and Wipe WhatsApp Session completely
app.post('/api/admin/bot-logout', checkAuth, async (req, res) => {
  try {
    await bot.logoutAndWipeSession();
    res.json({ message: 'חשבון הוואטסאפ נותק וכל נתוני החיבור נמחקו לצמיתות מהשרת! ✅' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'שגיאה בניתוק החשבון' });
  }
});

// Send Test Message
app.post('/api/admin/send-test', checkAuth, async (req, res) => {
  try {
    const config = getConfig();
    const testEntry = {
      name: "דני (הודעת בדיקה)",
      year: 2000,
      customWish: "זוהי הודעת בדיקה למערכת ימי ההולדת! 🚀"
    };

    await bot.sendBirthdayGreeting(testEntry, config);
    res.json({ message: `הודעת בדיקה נשלחה בהצלחה לקבוצה "${config.groupName}"! 🎉` });
  } catch (err) {
    res.status(500).json({ message: err.message || 'שגיאה בשליחת הודעת בדיקה' });
  }
});

// Update Birthday
app.put('/api/admin/birthdays/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  const {
    name,
    gender,
    dateType,
    day,
    month,
    year,
    hebrewDay,
    hebrewMonth,
    hebrewYear,
    reminderType,
    relation,
    customWish
  } = req.body;

  let list = getBirthdays();
  const index = list.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'רשומה לא נמצאה' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'שם מלא הינו שדה חובה' });
  }

  let finalDay = day ? parseInt(day, 10) : null;
  let finalMonth = month ? parseInt(month, 10) : null;
  let finalYear = year ? parseInt(year, 10) : null;

  let finalHebDay = hebrewDay ? parseInt(hebrewDay, 10) : null;
  let finalHebMonth = hebrewMonth || null;
  let finalHebYear = hebrewYear ? parseInt(hebrewYear, 10) : null;
  let finalHebDateStr = '';

  if (dateType === 'hebrew' && finalHebDay && finalHebMonth) {
    const gregInfo = convertHebrewToGregorian(finalHebDay, finalHebMonth, 5784);
    finalDay = gregInfo.day;
    finalMonth = gregInfo.month;
    finalHebDateStr = `${toGematriya(finalHebDay)} ב${finalHebMonth}`;
  } else if (finalDay && finalMonth) {
    const hebInfo = convertGregorianToHebrew(finalDay, finalMonth, 2024);
    finalHebDay = hebInfo.hebrewDay;
    finalHebMonth = hebInfo.hebrewMonth;
    finalHebDateStr = hebInfo.hebrewDateStr;
  }

  list[index] = {
    ...list[index],
    name: name.trim(),
    gender: gender || list[index].gender || 'unspecified',
    day: finalDay || list[index].day,
    month: finalMonth || list[index].month,
    hebrewDay: finalHebDay,
    hebrewMonth: finalHebMonth,
    hebrewDateStr: finalHebDateStr,
    reminderType: reminderType || (dateType === 'hebrew' ? 'hebrew' : 'gregorian'),
    relation: relation ? relation.trim() : '',
    customWish: customWish ? customWish.trim() : '',
    updatedAt: new Date().toISOString()
  };

  saveBirthdays(list);
  console.log(`[API] ✏️ עודכנה רשומת יום הולדת: ${list[index].name} (${list[index].day}/${list[index].month})`);
  res.json({ message: 'הרשומה עודכנה בהצלחה! ✅', entry: list[index] });
});

// Delete Birthday
app.delete('/api/admin/birthdays/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  let list = getBirthdays();
  const initialLen = list.length;
  list = list.filter(item => item.id !== id);

  if (list.length === initialLen) {
    return res.status(404).json({ message: 'רשומה לא נמצאה' });
  }

  saveBirthdays(list);
  res.json({ message: 'נמחק בהצלחה' });
});

// ----------------------------------------------------
// Daily Birthday Cron Job Scheduler
// ----------------------------------------------------
let scheduledTask = null;

function scheduleDailyJob() {
  if (scheduledTask) {
    scheduledTask.stop();
  }

  const config = getConfig();
  const hour = config.notificationHour !== undefined ? config.notificationHour : 8;
  const minute = config.notificationMinute !== undefined ? config.notificationMinute : 30;

  // Cron format: MINUTE HOUR * * * with Asia/Jerusalem timezone
  const cronExpr = `${minute} ${hour} * * *`;
  console.log(`⏰ משימת ימי הולדת מתוזמנת לשעה ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} (שעון ישראל) בכל יום.`);

  scheduledTask = cron.schedule(cronExpr, async () => {
    console.log('⏰ מתחיל בדיקת ימי הולדת יומית (שעון ישראל)...');
    await checkAndSendTodayBirthdays();
  }, {
    timezone: "Asia/Jerusalem"
  });
}

async function checkAndSendTodayBirthdays() {
  const israelDateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
  const now = new Date(israelDateStr);
  const todayDay = now.getDate();
  const todayMonth = now.getMonth() + 1;

  // Calculate Hebrew date for today in Israel
  const todayHeb = convertGregorianToHebrew(todayDay, todayMonth, now.getFullYear());
  const todayHebDay = todayHeb.hebrewDay;
  const todayHebMonth = todayHeb.hebrewMonth;
  const todayHebStr = todayHeb.hebrewDateStr;

  console.log(`[Daily Check] תאריך לועזי היום: ${todayDay}/${todayMonth} | תאריך עברי היום: ${todayHebStr}`);

  const list = getBirthdays();
  const config = getConfig();

  const todayCelebrants = list.filter(item => {
    if (item.reminderType === 'hebrew') {
      return item.hebrewDay === todayHebDay && item.hebrewMonth === todayHebMonth;
    }
    // Default: Gregorian
    return item.day === todayDay && item.month === todayMonth;
  });

  if (todayCelebrants.length === 0) {
    console.log(`[Daily Check] אין היום ימי הולדת ברשימה.`);
    return;
  }

  console.log(`[Daily Check] נמצאו ${todayCelebrants.length} חוגגים היום! שולח ברכות...`);

  for (const celebrant of todayCelebrants) {
    try {
      await bot.sendBirthdayGreeting(celebrant, config);
    } catch (err) {
      console.error(`[Daily Check] שגיאה בשליחת ברכה ל-${celebrant.name}:`, err.message);
    }
  }
}

// ----------------------------------------------------
// Start Server & Bot
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=================================================`);
  console.log(`🎉 שרת עמוד הנחיתה והבוט פועל בהצלחה!`);
  console.log(`🌐 עמוד הנחיתה המשפחתי: http://localhost:${PORT}`);
  console.log(`⚙️  עמוד הניהול של הבוט: http://localhost:${PORT}/admin.html`);
  console.log(`=================================================\n`);

  scheduleDailyJob();

  // Initialize WhatsApp Bot asynchronously without blocking
  setTimeout(() => {
    bot.initialize().catch(err => console.error('Bot init error:', err));
  }, 500);
});
