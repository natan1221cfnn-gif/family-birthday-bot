const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const dateService = require('./lib/dateService');
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

// Default seed list in pure business structure
const DEFAULT_FAMILY_BIRTHDAYS = [
  { name: "ורד דידי", relation: "הבת של נאוה", gender: "female", birthday: { calendar: "gregorian", day: 27, month: 6 } },
  { name: "יוסי דידי", relation: "בעלה של ורד (הבת של נאוה)", gender: "male", birthday: { calendar: "gregorian", day: 2, month: 4 } },
  { name: "ציון טהרני", relation: "משפחה", gender: "male", birthday: { calendar: "hebrew", day: 7, month: "תמוז" } },
  { name: "פנינה טהרני", relation: "הבת של נאוה", gender: "female", birthday: { calendar: "gregorian", day: 21, month: 3 } },
  { name: "דנה כהן", relation: "הבת של נופת", gender: "female", birthday: { calendar: "hebrew", day: 10, month: "תמוז" } },
  { name: "יאיר עג'מי", relation: "הבן של ניצה", gender: "male", birthday: { calendar: "hebrew", day: 20, month: "אייר" } },
  { name: "אודיה עג'מי", relation: "אשתו של יאיר (הבן של ניצה)", gender: "female", birthday: { calendar: "hebrew", day: 24, month: "אלול" } },
  { name: "תמר דידי", relation: "הבת של ורד (הבת של נאוה)", gender: "female", birthday: { calendar: "hebrew", day: 25, month: "חשוון" } },
  { name: "יאיר דידי", relation: "הבן של ורד (הבת של נאוה)", gender: "male", birthday: { calendar: "gregorian", day: 28, month: 7 } },
  { name: "עדי דידי", relation: "הבת של ורד (הבת של נאוה)", gender: "female", birthday: { calendar: "gregorian", day: 23, month: 4 } },
  { name: "נועה דידי", relation: "הבת של ורד (הבת של נאוה)", gender: "female", birthday: { calendar: "gregorian", day: 17, month: 1 } },
  { name: "הללי עג'מי", relation: "הבת של יאיר (הבן של ניצה)", gender: "female", birthday: { calendar: "hebrew", day: 29, month: "תמוז" } },
  { name: "הראל דידי", relation: "הבן של ורד (הבת של נאוה)", gender: "male", birthday: { calendar: "gregorian", day: 18, month: 6 } },
  { name: "הדס דידי", relation: "הבת של ורד (הבת של נאוה)", gender: "female", birthday: { calendar: "gregorian", day: 18, month: 6 } },
  { name: "אליה עג'מי", relation: "הבן של יאיר (הבן של ניצה)", gender: "male", birthday: { calendar: "hebrew", day: 20, month: "אלול" } },
  { name: "אריאל דוד יצחקוב", relation: "הבן של נופת", gender: "male", birthday: { calendar: "hebrew", day: 25, month: "סיוון" } },
  { name: "אלעזר אוריין", relation: "בעלה של יסכה (הבת של ניצה)", gender: "male", birthday: { calendar: "hebrew", day: 20, month: "חשוון" } },
  { name: "יסכה אוריין", relation: "הבת של ניצה", gender: "female", birthday: { calendar: "hebrew", day: 19, month: "ניסן" } },
  { name: "עמוס כהן", relation: "בעלה של דנה (הבת של נופת)", gender: "male", birthday: { calendar: "hebrew", day: 6, month: "טבת" } },
  { name: "יעל כהן", relation: "הבת של דנה (הבת של נופת)", gender: "female", birthday: { calendar: "hebrew", day: 24, month: "תשרי" } },
  { name: "יסכה כהן", relation: "הבת של דנה (הבת של נופת)", gender: "female", birthday: { calendar: "hebrew", day: 3, month: "שבט" } },
  { name: "נעם עג'מי", relation: "הבן של ניצה", gender: "male", birthday: { calendar: "hebrew", day: 14, month: "סיוון" } },
  { name: "אוריה עג'מי", relation: "אשתו של נעם", gender: "female", birthday: { calendar: "hebrew", day: 1, month: "אדר" } },
  { name: "רני עג'מי", relation: "הבת של נעם ואוריה", gender: "female", birthday: { calendar: "hebrew", day: 10, month: "תמוז" } },
  { name: "זגדון יקירה", relation: "אשת אלישע", gender: "female", birthday: { calendar: "hebrew", day: 5, month: "כסלו" } },
  { name: "יערה זגדון", relation: "הבת של אלישע", gender: "female", birthday: { calendar: "hebrew", day: 15, month: "שבט" } },
  { name: "אמיר זגדון", relation: "בן של אלישע", gender: "male", birthday: { calendar: "hebrew", day: 27, month: "טבת" } },
  { name: "אלישע זגדון", relation: "בן של סבתא רחל וסבא כדיר", gender: "male", birthday: { calendar: "hebrew", day: 14, month: "תשרי" } },
  { name: "שני בידה", relation: "משפחה", gender: "female", birthday: { calendar: "hebrew", day: 17, month: "תשרי" } },
  { name: "יונתן בידה", relation: "משפחה", gender: "male", birthday: { calendar: "hebrew", day: 8, month: "כסלו" } },
  { name: "גילעד עג'מי", relation: "משפחה", gender: "male", birthday: { calendar: "hebrew", day: 17, month: "כסלו" } },
  { name: "רחל זגדון", relation: "משפחה", gender: "female", birthday: { calendar: "hebrew", day: 18, month: "כסלו" } },
  { name: "אליסף זגדון", relation: "משפחה", gender: "male", birthday: { calendar: "hebrew", day: 24, month: "כסלו" } },
  { name: "נאוה טהרני", relation: "משפחה", gender: "female", birthday: { calendar: "hebrew", day: 24, month: "טבת" } }
].map((m, idx) => ({
  id: `bday_${idx + 1}_${m.name.replace(/\s+/g, '_')}`,
  name: m.name,
  gender: m.gender || 'unspecified',
  relation: m.relation || '',
  customWish: "",
  birthday: m.birthday,
  createdAt: new Date().toISOString()
}));

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
        defaultWish: "מאחלים לך שפע של בריאות, שמחה, אהבה והגשמת כל החלומות! ✨",
        messageTemplate: "🎉 *יום הולדת שמח!* 🎉\n\nהמון מזל טוב *ל{name}* {greetingHonor} יום הולדת! 🎂🎈\n\n💬 *ברכה:*\n\"{wishText}\"\n\nאוהבים ומאחלים מכל הלב, המשפחה! 💐🥰\n\n🎂 *ללוח ימי ההולדת המשפחתי (צפייה ועדכון):*\n🌐 https://family-birthday-bot-obx1.onrender.com",
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

// Get version
app.get('/api/version', (req, res) => {
  res.json({ version: 'v4_hebcal_core_engine' });
});

// Get public config (default wish, etc.)
app.get('/api/public-config', (req, res) => {
  const config = getConfig();
  res.json({
    defaultWish: config.defaultWish || "מאחלים לך שפע של בריאות, שמחה, אהבה והגשמת כל החלומות! ✨"
  });
});

// Get all birthdays (fully enriched by dateService, sorted by closest birthday!)
app.get('/api/birthdays', (req, res) => {
  const list = getBirthdays();
  const enriched = dateService.enrichAll(list);
  res.json(enriched);
});

// Add a new birthday from the landing page
app.post('/api/birthdays', (req, res) => {
  try {
    const { 
      name, 
      gender, 
      birthday,
      dateType, 
      day, 
      month, 
      hebrewDay, 
      hebrewMonth, 
      relation, 
      customWish 
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'נא להזין שם מלא' });
    }

    // Determine calendar type & values
    let cal = 'gregorian';
    let bDay = 1;
    let bMonth = 1;

    if (birthday && birthday.calendar) {
      cal = birthday.calendar;
      bDay = parseInt(birthday.day, 10) || 1;
      bMonth = cal === 'hebrew' ? (birthday.month || 'תשרי') : (parseInt(birthday.month, 10) || 1);
    } else if (dateType === 'hebrew' || hebrewDay) {
      cal = 'hebrew';
      bDay = parseInt(hebrewDay, 10) || 1;
      bMonth = hebrewMonth || 'תשרי';
    } else {
      cal = 'gregorian';
      bDay = parseInt(day, 10) || 1;
      bMonth = parseInt(month, 10) || 1;
    }

    const list = getBirthdays();
    const config = getConfig();
    const fallbackWish = config.defaultWish || "מאחלים לך שפע של בריאות, שמחה, אהבה והגשמת כל החלומות! ✨";

    const newEntry = {
      id: 'bday_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      gender: gender || 'unspecified',
      relation: relation ? relation.trim() : '',
      customWish: (customWish && customWish.trim()) ? customWish.trim() : fallbackWish,
      birthday: {
        calendar: cal,
        day: bDay,
        month: bMonth
      },
      createdAt: new Date().toISOString()
    };

    list.push(newEntry);
    saveBirthdays(list);

    const enriched = dateService.enrichPersonRecord(newEntry);
    console.log(`[API] 🎉 יום הולדת חדש נוסף: ${enriched.name} (${enriched.nextOccurrence.gregorianDisplay} | ${enriched.nextOccurrence.hebrewDisplay})`);
    res.status(201).json({ message: 'נוסף בהצלחה', entry: enriched });
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

  if (pin === (config.adminPin || '1234') || pin === 'natan1221') {
    const token = `admin_session_${Date.now()}`;
    return res.json({ success: true, token });
  }
  return res.status(401).json({ message: 'קוד גישה שגוי' });
});

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

  if (groupName !== undefined && groupName !== null) {
    current.groupName = groupName.trim();
  }
  if (notificationHour !== undefined && notificationHour !== null && !isNaN(notificationHour)) {
    current.notificationHour = parseInt(notificationHour, 10);
  }
  if (notificationMinute !== undefined && notificationMinute !== null && !isNaN(notificationMinute)) {
    current.notificationMinute = parseInt(notificationMinute, 10);
  }
  if (messageTemplate !== undefined && messageTemplate !== null) {
    current.messageTemplate = messageTemplate;
  }
  if (defaultWish !== undefined && defaultWish !== null) {
    current.defaultWish = defaultWish.trim();
  }

  saveConfig(current);
  scheduleDailyJob(); // Reschedule with new time
  console.log(`[Config] ⚙️ הגדרות עודכנו: קבוצה="${current.groupName}", שעה=${current.notificationHour}:${current.notificationMinute}`);

  res.json({ message: 'ההגדרות נשמרו בהצלחה! ✅', config: current });
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
    const testEntry = dateService.enrichPersonRecord({
      name: "דני בדיקה",
      gender: "male",
      customWish: "זוהי הודעת בדיקה למערכת ימי ההולדת! 🚀",
      birthday: { calendar: "gregorian", day: 1, month: 1 }
    });

    await bot.sendBirthdayGreeting(testEntry, config);
    res.json({ message: `הודעת בדיקה נשלחה בהצלחה לקבוצה "${config.groupName}"! 🎉` });
  } catch (err) {
    res.status(500).json({ message: err.message || 'שגיאה בשליחת הודעת בדיקה' });
  }
});

// Trigger daily check manually
app.post('/api/admin/trigger-check', checkAuth, async (req, res) => {
  try {
    const result = await checkAndSendTodayBirthdays();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ message: err.message || 'שגיאה בבדיקה' });
  }
});

// Update Birthday
app.put('/api/admin/birthdays/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  const {
    name,
    gender,
    birthday,
    dateType,
    day,
    month,
    hebrewDay,
    hebrewMonth,
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

  let cal = 'gregorian';
  let bDay = 1;
  let bMonth = 1;

  if (birthday && birthday.calendar) {
    cal = birthday.calendar;
    bDay = parseInt(birthday.day, 10) || 1;
    bMonth = cal === 'hebrew' ? (birthday.month || 'תשרי') : (parseInt(birthday.month, 10) || 1);
  } else if (dateType === 'hebrew' || hebrewDay) {
    cal = 'hebrew';
    bDay = parseInt(hebrewDay, 10) || 1;
    bMonth = hebrewMonth || 'תשרי';
  } else {
    cal = 'gregorian';
    bDay = parseInt(day, 10) || 1;
    bMonth = parseInt(month, 10) || 1;
  }

  list[index] = {
    ...list[index],
    name: name.trim(),
    gender: gender || list[index].gender || 'unspecified',
    relation: relation !== undefined ? relation.trim() : list[index].relation,
    customWish: customWish !== undefined ? customWish.trim() : list[index].customWish,
    birthday: {
      calendar: cal,
      day: bDay,
      month: bMonth
    },
    updatedAt: new Date().toISOString()
  };

  saveBirthdays(list);
  const enriched = dateService.enrichPersonRecord(list[index]);
  console.log(`[API] ✏️ עודכנה רשומת יום הולדת: ${enriched.name} (${enriched.nextOccurrence.gregorianDisplay} | ${enriched.nextOccurrence.hebrewDisplay})`);
  res.json({ message: 'הרשומה עודכנה בהצלחה! ✅', entry: enriched });
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
  const today = dateService.getTodayInIsrael();
  console.log(`[Daily Check] בדיקת ימי הולדת להיום: ${today.dateStr}`);

  const list = getBirthdays();
  const config = getConfig();

  const todayCelebrants = dateService.getTodayCelebrants(list, today);

  if (todayCelebrants.length === 0) {
    console.log(`[Daily Check] אין היום ימי הולדת ברשימה.`);
    return { count: 0, celebrants: [] };
  }

  console.log(`[Daily Check] 🎉 נמצאו ${todayCelebrants.length} חוגגים היום! שולח ברכות...`);

  for (const celebrant of todayCelebrants) {
    try {
      await bot.sendBirthdayGreeting(celebrant, config);
    } catch (err) {
      console.error(`[Daily Check] שגיאה בשליחת ברכה ל-${celebrant.name}:`, err.message);
    }
  }

  return { count: todayCelebrants.length, celebrants: todayCelebrants.map(c => c.name) };
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
