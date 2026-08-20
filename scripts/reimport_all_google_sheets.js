const fs = require('fs');
const path = require('path');
const { parseHebrewDateString } = require('../lib/hebrewDateParser');
const { 
  convertHebrewToGregorian, 
  convertGregorianToHebrew, 
  toGematriya,
  normalizeHebrewMonth 
} = require('../lib/hebrewCalendar');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function parseGregorianDate(str) {
  if (!str) return null;
  const clean = str.replace(/['"]/g, '').trim();
  if (!clean) return null;
  const match = clean.match(/^(\d{1,2})[\/\.](\d{1,2})(?:[\/\.](\d{2,4}))?$/);
  if (!match) return null;
  let day = parseInt(match[1], 10);
  let month = parseInt(match[2], 10);
  let year = match[3] ? parseInt(match[3], 10) : undefined;
  if (year && year < 100) {
    year = year > 30 ? 1900 + year : 2000 + year;
  }
  return { day, month, year };
}

function determineGender(name, relation) {
  const text = `${name} ${relation}`;
  if (name.includes('אלישע') || name.includes('ציון') || name.includes('עמוס') || name.includes('אלעזר') || name.includes('יאיר') || name.includes('יוסי') || name.includes('הראל') || name.includes('אליה') || name.includes('אריאל') || name.includes('נעם') || name.includes('אמיר') || name.includes('בעז') || name.includes('גילעד') || name.includes('יונתן')) {
    return 'male';
  }
  if (text.includes('הבת') || text.includes('אשתו') || text.includes('אשת') || text.includes('בת של') || text.includes('סבתא')) {
    return 'female';
  }
  if (text.includes('הבן') || text.includes('בעלה') || text.includes('בן של') || text.includes('סבא')) {
    return 'male';
  }
  return 'female';
}

async function run() {
  const res = await fetch('https://docs.google.com/spreadsheets/d/1mKAEYPcWTuwP4Lz9Z1XrgIZNURZ4J9xtJHxHpeuk-ts/gviz/tq?tqx=out:csv');
  const csv = await res.text();
  const lines = csv.split('\n');

  const members = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    const name = cols[0]?.replace(/^"|"$/g, '').trim();
    if (!name) continue;

    const relation = cols[1]?.replace(/^"|"$/g, '').trim() || '';
    const rawHebDate = cols[2]?.replace(/^"|"$/g, '').trim() || '';
    const rawGregDate = cols[3]?.replace(/^"|"$/g, '').trim() || '';
    const rawReminderPref = cols[6]?.replace(/^"|"$/g, '').trim() || '';

    const gender = determineGender(name, relation);
    let reminderType = rawReminderPref.includes('עברי') ? 'hebrew' : (rawReminderPref.includes('לועזי') ? 'gregorian' : null);

    const parsedHeb = parseHebrewDateString(rawHebDate);
    const parsedGreg = parseGregorianDate(rawGregDate);

    let day = null;
    let month = null;
    let year = null;
    let hebrewDay = null;
    let hebrewMonth = null;
    let hebrewYear = null;
    let hebrewDateStr = '';

    if (parsedHeb && parsedHeb.hebrewDay && parsedHeb.hebrewMonth) {
      hebrewDay = parsedHeb.hebrewDay;
      hebrewMonth = parsedHeb.hebrewMonth;
      hebrewYear = parsedHeb.hebrewYear;
      hebrewDateStr = `${toGematriya(hebrewDay)} ב${hebrewMonth}${hebrewYear ? ' ' + toGematriya(hebrewYear) : ''}`;

      if (!reminderType) reminderType = 'hebrew';

      if (parsedGreg && parsedGreg.day && parsedGreg.month) {
        day = parsedGreg.day;
        month = parsedGreg.month;
        year = parsedGreg.year;
      } else {
        const gregConv = convertHebrewToGregorian(hebrewDay, hebrewMonth, hebrewYear || 5784);
        day = gregConv.day;
        month = gregConv.month;
        year = hebrewYear ? gregConv.year : null;
      }
    } else if (parsedGreg && parsedGreg.day && parsedGreg.month) {
      day = parsedGreg.day;
      month = parsedGreg.month;
      year = parsedGreg.year;
      if (!reminderType) reminderType = 'gregorian';

      const hConv = convertGregorianToHebrew(day, month, year);
      hebrewDay = hConv.hebrewDay;
      hebrewMonth = hConv.hebrewMonth;
      hebrewYear = hConv.hebrewYear;
      hebrewDateStr = hConv.hebrewDateStr;
    }

    members.push({
      id: `bday_${i}_${name.replace(/\s+/g, '_')}`,
      name,
      gender,
      day,
      month,
      year: year || null,
      hebrewDay,
      hebrewMonth,
      hebrewYear: hebrewYear || null,
      hebrewDateStr,
      reminderType: reminderType || 'gregorian',
      relation,
      customWish: '',
      createdAt: new Date().toISOString()
    });
  }

  // Also include newly registered members from website
  members.push({
    id: 'bday_1787241601658_11ywf',
    name: 'יונתן בידה',
    gender: 'male',
    day: 2,
    month: 12,
    year: 2022,
    hebrewDay: 8,
    hebrewMonth: 'כסלו',
    hebrewYear: 5783,
    hebrewDateStr: "ח' בכסלו תשפ\"ג",
    reminderType: 'hebrew',
    relation: 'הבן של בתאל לבית יצחקוב',
    customWish: 'מאחלים לך שפע של בריאות, שמחה, אהבה והגשמת כל החלומות! ✨',
    createdAt: '2026-08-20T16:00:01.658Z'
  });

  members.push({
    id: 'bday_1787240921102_he0p7',
    name: 'שני בידה',
    gender: 'female',
    day: 2,
    month: 10,
    year: 2023,
    hebrewDay: 17,
    hebrewMonth: 'תשרי',
    hebrewYear: 5784,
    hebrewDateStr: "י\"ז בתשרי תשפ\"ד",
    reminderType: 'hebrew',
    relation: 'הבת של בתאל לבית יצחקוב',
    customWish: 'עד 120 בבריאות, אושר והמון חיוכים! 🎈',
    createdAt: '2026-08-20T15:48:41.102Z'
  });

  console.log(`Total members parsed and enriched: ${members.length}`);

  const elisha = members.find(m => m.name.includes('אלישע'));
  console.log('Elisha Zagdon check:', elisha);

  // Save to birthdays.json
  const dataPath = path.join(__dirname, '..', 'data', 'birthdays.json');
  fs.writeFileSync(dataPath, JSON.stringify(members, null, 2), 'utf8');

  // Push to Live Server
  const authRes = await fetch('https://family-birthday-bot-obx1.onrender.com/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: 'natan1221' })
  });
  const authData = await authRes.json();

  const setRes = await fetch('https://family-birthday-bot-obx1.onrender.com/api/admin/set-birthdays', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authData.token
    },
    body: JSON.stringify({ birthdays: members })
  });
  const setResult = await setRes.json();
  console.log('Live Sync Result:', setResult);
}

run().catch(console.error);
