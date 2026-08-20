// Pure JavaScript Verified Hebrew Calendar Converter (Zero Dependencies)
// Exact mathematical Jewish Calendar (Maimonides / Molad Tohu / Gauss)

const HEBREW_MONTHS_NAMES = [
  "תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר", "אדר א'", "אדר ב'", "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"
];

const HEBREW_NUMERALS = [
  "א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ז'", "ח'", "ט'", "י'",
  "י\"א", "י\"ב", "י\"ג", "י\"ד", "ט\"ו", "ט\"ז", "י\"ז", "י\"ח", "י\"ט", "כ'",
  "כ\"א", "כ\"ב", "כ\"ג", "כ\"ד", "כ\"ה", "כ\"ו", "כ\"ז", "כ\"ח", "כ\"ט", "ל'"
];

function normalizeHebrewMonth(str) {
  if (!str) return 'תשרי';
  const clean = str.toString().trim().toLowerCase();
  const map = {
    'tishrei': 'תשרי', 'תשרי': 'תשרי',
    'cheshvan': 'חשוון', 'חשוון': 'חשוון', 'חשון': 'חשוון', 'marcheshvan': 'חשוון', 'מרחשוון': 'חשוון',
    'kislev': 'כסלו', 'כסלו': 'כסלו', 'כסליו': 'כסלו',
    'tevet': 'טבת', 'טבת': 'טבת',
    'shvat': 'שבט', "sh'vat": 'שבט', 'שבט': 'שבט',
    'adar': 'אדר', 'אדר': 'אדר', 'adar 1': "אדר א'", 'adar 2': "אדר ב'",
    'אדר א': "אדר א'", "אדר א'": "אדר א'",
    'אדר ב': "אדר ב'", "אדר ב'": "אדר ב'",
    'nisan': 'ניסן', 'ניסן': 'ניסן',
    'iyyar': 'אייר', 'אייר': 'אייר', 'איר': 'אייר',
    'sivan': 'סיוון', 'סיוון': 'סיוון', 'סיון': 'סיוון',
    'tamuz': 'תמוז', 'tammuz': 'תמוז', 'תמוז': 'תמוז',
    'av': 'אב', 'אב': 'אב', 'menachem av': 'אב', 'מנחם אב': 'אב',
    'elul': 'אלול', 'אלול': 'אלול'
  };
  return map[clean] || map[str.toString().trim()] || 'תשרי';
}

function parseHebrewYear(str) {
  if (!str) return null;
  if (typeof str === 'number') {
    if (str > 5000) return str;
    if (str > 1900 && str < 2100) return str + 3760;
    return str;
  }
  const clean = str.toString().replace(/['"״׳\s]/g, '');
  if (/^\d+$/.test(clean)) {
    const num = parseInt(clean, 10);
    if (num > 5000) return num;
    if (num > 1900 && num < 2100) return num + 3760;
    return num;
  }
  const values = {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90,
    'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400
  };
  let sum = 0;
  for (const c of clean) {
    if (values[c]) sum += values[c];
  }
  if (sum > 0) {
    return sum < 1000 ? 5000 + sum : sum;
  }
  return null;
}

function isHebrewLeapYear(year) {
  return ((7 * year + 1) % 19) < 7;
}

// Calculate the Julian Day Number for 1 Tishrei of Hebrew Year
function hebrewRoshHashanaJdn(year) {
  const monthsElapsed = Math.floor((235 * year - 234) / 19);
  const partsElapsed = 31524 + 765433 * monthsElapsed;
  let day = Math.floor(partsElapsed / 25920);
  const parts = partsElapsed % 25920;

  // Dechiyot
  if (parts >= 19440) {
    day += 1;
  }

  let dow = day % 7;
  if (dow === 0 || dow === 3 || dow === 5) {
    day += 1;
  } else if (dow === 2 && parts >= 9924 && !isHebrewLeapYear(year)) {
    day += 2;
  } else if (dow === 1 && parts >= 16789 && isHebrewLeapYear(year - 1)) {
    day += 1;
  }

  return day + 347997;
}

function getDaysInHebrewYear(year) {
  return hebrewRoshHashanaJdn(year + 1) - hebrewRoshHashanaJdn(year);
}

function getDaysInHebrewMonth(year, monthIndex) {
  const isLeap = isHebrewLeapYear(year);
  const yearLength = getDaysInHebrewYear(year);

  // Month 0: Tishrei = 30
  if (monthIndex === 0) return 30;
  // Month 1: Cheshvan
  if (monthIndex === 1) return (yearLength === 355 || yearLength === 385) ? 30 : 29;
  // Month 2: Kislev
  if (monthIndex === 2) return (yearLength === 353 || yearLength === 383) ? 29 : 30;
  // Month 3: Tevet = 29
  if (monthIndex === 3) return 29;
  // Month 4: Shvat = 30
  if (monthIndex === 4) return 30;

  if (isLeap) {
    if (monthIndex === 5) return 30; // Adar I
    if (monthIndex === 6) return 29; // Adar II
    if (monthIndex === 7) return 30; // Nisan
    if (monthIndex === 8) return 29; // Iyyar
    if (monthIndex === 9) return 30; // Sivan
    if (monthIndex === 10) return 29; // Tamuz
    if (monthIndex === 11) return 30; // Av
    if (monthIndex === 12) return 29; // Elul
  } else {
    if (monthIndex === 5) return 29; // Adar
    if (monthIndex === 6) return 30; // Nisan
    if (monthIndex === 7) return 29; // Iyyar
    if (monthIndex === 8) return 30; // Sivan
    if (monthIndex === 9) return 29; // Tamuz
    if (monthIndex === 10) return 30; // Av
    if (monthIndex === 11) return 29; // Elul
  }
  return 29;
}

function julianToGregorian(jdn) {
  let a = jdn + 32044;
  let b = Math.floor((4 * a + 3) / 146097);
  let c = a - Math.floor((146097 * b) / 4);
  let d = Math.floor((4 * c + 3) / 1461);
  let e = c - Math.floor((1461 * d) / 4);
  let m = Math.floor((5 * e + 2) / 153);

  let day = e - Math.floor((153 * m + 2) / 5) + 1;
  let month = m + 3 - 12 * Math.floor(m / 10);
  let year = 100 * b + d - 4800 + Math.floor(m / 10);

  return { day, month, year };
}

function gregorianToJulian(year, month, day) {
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function toGematriya(num) {
  if (num <= 0) return '';
  if (num <= 30 && HEBREW_NUMERALS[num - 1]) return HEBREW_NUMERALS[num - 1];
  
  let rem = num % 1000;
  
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hundreds = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];

  let res = "";
  if (rem >= 100) {
    res += hundreds[Math.floor(rem / 100)];
    rem %= 100;
  }
  if (rem === 15) {
    res += "טו";
  } else if (rem === 16) {
    res += "טז";
  } else {
    if (rem >= 10) {
      res += tens[Math.floor(rem / 10)];
      rem %= 10;
    }
    if (rem > 0) {
      res += ones[rem];
    }
  }

  if (res.length === 1) {
    return res + "'";
  } else if (res.length > 1) {
    return res.slice(0, -1) + '"' + res.slice(-1);
  }
  return res;
}

// Convert Gregorian Date to Hebrew Date
function convertGregorianToHebrew(day, month, year) {
  const gYear = year ? parseInt(year, 10) : 2024;
  const gMonth = parseInt(month, 10);
  const gDay = parseInt(day, 10);

  const jdn = gregorianToJulian(gYear, gMonth, gDay);

  let hYear = gYear + 3760;
  while (hebrewRoshHashanaJdn(hYear + 1) <= jdn) {
    hYear++;
  }
  while (hebrewRoshHashanaJdn(hYear) > jdn) {
    hYear--;
  }

  let daysSinceRH = jdn - hebrewRoshHashanaJdn(hYear);
  let mIndex = 0;
  while (true) {
    let dim = getDaysInHebrewMonth(hYear, mIndex);
    if (daysSinceRH < dim) break;
    daysSinceRH -= dim;
    mIndex++;
  }

  const isLeap = isHebrewLeapYear(hYear);
  const monthNames = isLeap
    ? ["תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר א'", "אדר ב'", "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"]
    : ["תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר", "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"];

  const hDay = daysSinceRH + 1;
  const hMonthName = monthNames[mIndex];
  const dayGematriya = toGematriya(hDay);
  const yearGematriya = year ? toGematriya(hYear) : '';

  return {
    hebrewDay: hDay,
    hebrewMonth: hMonthName,
    hebrewMonthName: hMonthName,
    hebrewYear: year ? hYear : undefined,
    hebrewDateStr: `${dayGematriya} ב${hMonthName}${yearGematriya ? ' ' + yearGematriya : ''}`
  };
}

// Convert Hebrew Date to Gregorian Date
function convertHebrewToGregorian(hebrewDay, hebrewMonthInput, hebrewYearInput) {
  const normMonth = normalizeHebrewMonth(hebrewMonthInput);
  const hYear = parseHebrewYear(hebrewYearInput) || 5784;
  const hDay = parseInt(hebrewDay, 10) || 1;

  const isLeap = isHebrewLeapYear(hYear);
  const monthNames = isLeap
    ? ["תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר א'", "אדר ב'", "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"]
    : ["תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר", "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"];

  let mIndex = monthNames.indexOf(normMonth);
  if (mIndex === -1) {
    if (normMonth === "אדר א'" || normMonth === "אדר ב'") mIndex = 5;
    else mIndex = 0;
  }

  let jdn = hebrewRoshHashanaJdn(hYear);
  for (let i = 0; i < mIndex; i++) {
    jdn += getDaysInHebrewMonth(hYear, i);
  }
  jdn += (hDay - 1);

  const greg = julianToGregorian(jdn);
  return {
    day: greg.day,
    month: greg.month,
    year: greg.year
  };
}

module.exports = {
  convertGregorianToHebrew,
  convertHebrewToGregorian,
  normalizeHebrewMonth,
  parseHebrewYear,
  toGematriya,
  HEBREW_MONTHS_NAMES,
  HEBREW_NUMERALS
};
