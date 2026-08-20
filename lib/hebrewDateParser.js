const { 
  convertGregorianToHebrew, 
  convertHebrewToGregorian, 
  normalizeHebrewMonth, 
  parseHebrewYear,
  toGematriya,
  HEBREW_NUMERALS
} = require('./hebrewCalendar');

function parseHebrewDayGematriya(str) {
  if (!str) return 1;
  // Strip non-Hebrew / non-digit characters and trailing/leading preposition letters
  let clean = str.replace(/['"״׳\s]/g, '').trim();
  if (/^\d+$/.test(clean)) return parseInt(clean, 10);

  // If there's a trailing 'ב' from 'בשבט' or 'בתמוז'
  clean = clean.replace(/[בל]$/g, '').replace(/^[בל]/g, '');

  const values = {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 20, 'ל': 30
  };
  
  let sum = 0;
  for (const c of clean) {
    if (values[c]) sum += values[c];
  }
  return sum > 0 && sum <= 30 ? sum : 1;
}

function parseHebrewDateString(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') return null;
  const clean = rawStr.trim();
  if (!clean) return null;

  // List of known Hebrew months to look for (including preposition 'ב' / 'ל')
  const monthKeywords = [
    { name: "אדר א'", regex: /[בל]?\s*אדר\s*א['״׳]?/i },
    { name: "אדר ב'", regex: /[בל]?\s*אדר\s*ב['״׳]?/i },
    { name: "תשרי", regex: /[בל]?\s*תשרי/i },
    { name: "חשוון", regex: /[בל]?\s*(חשוון|חשון|מרחשוון|מרחשון)/i },
    { name: "כסלו", regex: /[בל]?\s*(כסלו|כסליו)/i },
    { name: "טבת", regex: /[בל]?\s*טבת/i },
    { name: "שבט", regex: /[בל]?\s*שבט/i },
    { name: "אדר", regex: /[בל]?\s*אדר/i },
    { name: "ניסן", regex: /[בל]?\s*ניסן/i },
    { name: "אייר", regex: /[בל]?\s*(אייר|איר)/i },
    { name: "סיוון", regex: /[בל]?\s*(סיוון|סיון)/i },
    { name: "תמוז", regex: /[בל]?\s*תמוז/i },
    { name: "אב", regex: /[בל]?\s*(אב|מנחם\s*אב)/i },
    { name: "אלול", regex: /[בל]?\s*אלול/i }
  ];

  let matchedMonth = null;
  let monthMatchIndex = -1;
  let monthMatchLength = 0;

  for (const m of monthKeywords) {
    const match = clean.match(m.regex);
    if (match) {
      matchedMonth = m.name;
      monthMatchIndex = match.index;
      monthMatchLength = match[0].length;
      break;
    }
  }

  if (!matchedMonth) return null;

  // Day part is before the month
  const beforeMonth = clean.substring(0, monthMatchIndex).trim();
  // Year part is after the month
  const afterMonth = clean.substring(monthMatchIndex + monthMatchLength).trim();

  // Parse day
  const hebrewDay = parseHebrewDayGematriya(beforeMonth);

  // Parse year if present
  let hebrewYear = null;
  if (afterMonth) {
    hebrewYear = parseHebrewYear(afterMonth);
  }

  return {
    hebrewDay,
    hebrewMonth: matchedMonth,
    hebrewYear
  };
}

module.exports = {
  parseHebrewDateString,
  parseHebrewDayGematriya
};
