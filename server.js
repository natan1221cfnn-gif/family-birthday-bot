const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
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

// Helpers to read/write JSON files safely
function getBirthdays() {
  try {
    if (!fs.existsSync(BIRTHDAYS_FILE)) return [];
    const data = fs.readFileSync(BIRTHDAYS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading birthdays.json:', err);
    return [];
  }
}

function saveBirthdays(list) {
  fs.writeFileSync(BIRTHDAYS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function getConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return {
        groupName: "משפחה",
        notificationHour: 8,
        notificationMinute: 30,
        messageTemplate: "🎉 *יום הולדת שמח!* 🎉\n\nהמון מזל טוב ל-*{name}* היקר/ה שחוגג/ת היום יום הולדת{ageText}! 🎂🎈\nמאחלים לך שפע של בריאות, אושר, שמחה והצלחה בכל מעשי ידיך! 🥳💐{customWish}",
        adminPin: "1234"
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
  const { name, day, month, year, relation, customWish } = req.body;

  if (!name || !day || !month) {
    return res.status(400).json({ message: 'שם, יום וחודש הם שדות חובה' });
  }

  const list = getBirthdays();
  const config = getConfig();
  const fallbackWish = config.defaultWish || "מאחלים לך שפע של בריאות, שמחה, אהבה והגשמת כל החלומות! ✨";

  const newEntry = {
    id: 'bday_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    name: name.trim(),
    day: parseInt(day, 10),
    month: parseInt(month, 10),
    year: year ? parseInt(year, 10) : null,
    relation: relation ? relation.trim() : '',
    customWish: (customWish && customWish.trim()) ? customWish.trim() : fallbackWish,
    createdAt: new Date().toISOString()
  };

  list.push(newEntry);
  saveBirthdays(list);

  console.log(`[API] 🎉 יום הולדת חדש נוסף: ${newEntry.name} (${newEntry.day}/${newEntry.month})`);
  res.status(201).json({ message: 'נוסף בהצלחה', entry: newEntry });
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

  // Cron format: MINUTE HOUR * * *
  const cronExpr = `${minute} ${hour} * * *`;
  console.log(`⏰ משימת ימי הולדת מתוזמנת לשעה ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} בכל יום.`);

  scheduledTask = cron.schedule(cronExpr, async () => {
    console.log('⏰ מתחיל בדיקת ימי הולדת יומית...');
    await checkAndSendTodayBirthdays();
  });
}

async function checkAndSendTodayBirthdays() {
  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.getMonth() + 1;

  const list = getBirthdays();
  const config = getConfig();

  const todayCelebrants = list.filter(item => item.day === todayDay && item.month === todayMonth);

  if (todayCelebrants.length === 0) {
    console.log(`[Daily Check] אין היום (${todayDay}/${todayMonth}) ימי הולדת ברשימה.`);
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
