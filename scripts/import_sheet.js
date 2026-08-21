const { HDate, HebrewCalendar, Location } = require('@hebcal/core');
const fs = require('fs');
const path = require('path');

const csvPath = 'C:\\Users\\natan\\.gemini\\antigravity\\brain\\00469b70-bfa3-4f4a-b8e2-b500ffb40c4e\\.system_generated\\steps\\641\\content.md';
const content = fs.readFileSync(csvPath, 'utf8');

// Parse CSV lines
function parseCSV(text) {
  const lines = text.split('\n');
  const results = [];
  for (const line of lines) {
    if (!line.trim() || line.startsWith('Title:') || line.startsWith('Description:') || line.startsWith('Source:') || line.startsWith('---')) continue;
    
    // Parse CSV line handling quotes
    const row = [];
    let inQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuote && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    if (row.length > 0 && row[0] && row[0] !== 'שם פרטי ושם משפחה') {
      results.push(row);
    }
  }
  return results;
}

const rows = parseCSV(content);

// Mapping of Hebrew month names in Hebrew to Hebcal month names
const hebrewMonths = {
  'ניסן': 'Nisan',
  'אייר': 'Iyyar',
  'איר': 'Iyyar',
  'סיון': 'Sivan',
  'סיוון': 'Sivan',
  'תמוז': 'Tamuz',
  'אב': 'Av',
  'אלול': 'Elul',
  'תשרי': 'Tishrei',
  'חשון': 'Cheshvan',
  'חשוון': 'Cheshvan',
  'מרחשון': 'Cheshvan',
  'מרחשוון': 'Cheshvan',
  'כסלו': 'Kislev',
  'כסליו': 'Kislev',
  'טבת': 'Tevet',
  'שבט': 'Shvat',
  'אדר': 'Adar',
  'אדר א': 'Adar 1',
  'אדר ב': 'Adar 2'
};

function parseHebrewNumber(str) {
  const clean = str.replace(/['"״׳\s]/g, '');
  const values = {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90,
    'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400
  };
  let sum = 0;
  for (const c of clean) {
    if (values[c]) sum += values[c];
  }
  return sum || null;
}

function parseHebrewDate(hebStr) {
  if (!hebStr || !hebStr.trim()) return null;
  const clean = hebStr.replace(/ב/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Find month
  let matchedMonth = null;
  let monthIndex = -1;
  for (const [hebM, engM] of Object.entries(hebrewMonths)) {
    if (clean.includes(hebM)) {
      matchedMonth = engM;
      monthIndex = clean.indexOf(hebM);
      break;
    }
  }
  if (!matchedMonth) return null;

  // Day is usually before the month
  const beforeMonth = clean.substring(0, monthIndex).trim();
  const day = parseHebrewNumber(beforeMonth) || 1;

  // Year is usually after the month
  const afterMonth = clean.substring(monthIndex).trim();
  const yearWords = afterMonth.split(' ').slice(1).join(' ').trim();
  let yearNum = null;
  if (yearWords) {
    const rawSum = parseHebrewNumber(yearWords);
    if (rawSum) {
      yearNum = 5000 + rawSum; // e.g. תשנ"ג = 753 -> 5753
    }
  }

  try {
    const hd = new HDate(day, matchedMonth, yearNum || 5784);
    const greg = hd.greg();
    return {
      day: greg.getDate(),
      month: greg.getMonth() + 1,
      year: yearNum ? greg.getFullYear() : undefined
    };
  } catch (e) {
    console.error('Error converting Hebrew date:', hebStr, e.message);
    return null;
  }
}

function parseGregorianDate(gregStr) {
  if (!gregStr || !gregStr.trim()) return null;
  const parts = gregStr.trim().split(/[\/\.\-]/);
  if (parts.length >= 2) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let year = parts[2] ? parseInt(parts[2], 10) : undefined;
    if (year && year < 100) {
      year = year > 30 ? 1900 + year : 2000 + year;
    }
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return { day, month, year };
    }
  }
  return null;
}

const birthdays = [];

for (const row of rows) {
  const name = row[0].trim();
  const relation = (row[1] || '').trim();
  const hebBirth = (row[2] || '').trim();
  const gregBirth = (row[3] || '').trim();

  let dateObj = parseGregorianDate(gregBirth);
  if (!dateObj && hebBirth) {
    dateObj = parseHebrewDate(hebBirth);
  }

  if (!dateObj) {
    console.warn(`⚠️ לא נמצא תאריך תקין עבור: ${name} (לועזי: "${gregBirth}", עברי: "${hebBirth}")`);
    continue;
  }

  const id = `bday_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  birthdays.push({
    id,
    name,
    day: dateObj.day,
    month: dateObj.month,
    year: dateObj.year || undefined,
    relation: relation || 'משפחה',
    customWish: '',
    createdAt: new Date().toISOString()
  });
}

console.log(`\n🎉 סה"כ נקלטו בהצלחה ${birthdays.length} בני משפחה:`);
console.log(JSON.stringify(birthdays, null, 2));

// Save to data/birthdays.json
fs.writeFileSync(
  path.join(__dirname, '..', 'data', 'birthdays.json'),
  JSON.stringify(birthdays, null, 2),
  'utf8'
);
console.log('\n✅ נשמר בהצלחה לקובץ data/birthdays.json!');
