const { HDate, months, gematriya, HebrewCalendar } = require('@hebcal/core');

// Month names in Hebrew
const HEBREW_MONTH_NAMES = {
  [months.NISAN]: 'ניסן',
  [months.IYYAR]: 'אייר',
  [months.SIVAN]: 'סיוון',
  [months.TAMUZ]: 'תמוז',
  [months.AV]: 'אב',
  [months.ELUL]: 'אלול',
  [months.TISHREI]: 'תשרי',
  [months.CHESHVAN]: 'חשוון',
  [months.KISLEV]: 'כסלו',
  [months.TEVET]: 'טבת',
  [months.SHVAT]: 'שבט',
  [months.ADAR_I]: "אדר א'",
  [months.ADAR_II]: "אדר ב'"
};

const GREGORIAN_MONTH_NAMES_HE = [
  "", "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
];

// Normalize Hebrew Month input to Hebcal month number (1-13)
function normalizeHebrewMonth(input, isLeapYear = false) {
  if (typeof input === 'number') {
    if (input >= 1 && input <= 13) {
      if (!isLeapYear && input === months.ADAR_II) return months.ADAR_I;
      return input;
    }
  }

  if (!input) return months.TISHREI;

  const str = input.toString().trim().replace(/['"״׳\s]/g, '').toLowerCase();

  const map = {
    'ניסן': months.NISAN, 'nisan': months.NISAN,
    'אייר': months.IYYAR, 'איר': months.IYYAR, 'iyyar': months.IYYAR, 'iyar': months.IYYAR,
    'סיוון': months.SIVAN, 'סיון': months.SIVAN, 'sivan': months.SIVAN,
    'תמוז': months.TAMUZ, 'tamuz': months.TAMUZ, 'tammuz': months.TAMUZ,
    'אב': months.AV, 'מנחםאב': months.AV, 'av': months.AV,
    'אלול': months.ELUL, 'elul': months.ELUL,
    'תשרי': months.TISHREI, 'tishrei': months.TISHREI, 'tishri': months.TISHREI,
    'חשוון': months.CHESHVAN, 'חשון': months.CHESHVAN, 'מרחשוון': months.CHESHVAN, 'מרחשון': months.CHESHVAN, 'cheshvan': months.CHESHVAN,
    'כסלו': months.KISLEV, 'כסליו': months.KISLEV, 'kislev': months.KISLEV,
    'טבת': months.TEVET, 'tevet': months.TEVET,
    'שבט': months.SHVAT, 'shevat': months.SHVAT, 'shvat': months.SHVAT,
    'אדרא': months.ADAR_I, 'אדר1': months.ADAR_I, 'adari': months.ADAR_I, 'adar1': months.ADAR_I,
    'אדרב': months.ADAR_II, 'אדר2': months.ADAR_II, 'adarii': months.ADAR_II, 'adar2': months.ADAR_II,
    'אדר': isLeapYear ? months.ADAR_II : months.ADAR_I,
    'adar': isLeapYear ? months.ADAR_II : months.ADAR_I
  };

  return map[str] || months.TISHREI;
}

// Get current date in Israel timezone
function getTodayInIsrael() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [year, month, day] = formatter.format(new Date()).split('-').map(Number);
  return { year, month, day, dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
}

// Days between two calendar dates (date-only, timezone-safe)
function daysBetween(from, to) {
  const d1 = Date.UTC(from.year, from.month - 1, from.day, 12, 0, 0);
  const d2 = Date.UTC(to.year, to.month - 1, to.day, 12, 0, 0);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

// Create an HDate safely handling leap years and month lengths
function createHDate(day, monthInput, hYear) {
  const isLeap = HDate.isLeapYear(hYear);
  const hMonth = normalizeHebrewMonth(monthInput, isLeap);

  // Month length check
  const daysInMonth = HDate.daysInMonth(hMonth, hYear);
  const safeDay = Math.min(Math.max(1, parseInt(day, 10) || 1), daysInMonth);

  return new HDate(safeDay, hMonth, hYear);
}

// Format Hebrew date with "ב" prefix e.g. "כ״ד בתשרי תשפ״ז"
function formatHebrewDate(hDate, includeYear = true) {
  const dayGematriya = gematriya(hDate.getDate());
  const isLeap = hDate.isLeapYear();
  let monthName = HEBREW_MONTH_NAMES[hDate.getMonth()];
  if (!isLeap && (hDate.getMonth() === months.ADAR_I || hDate.getMonth() === months.ADAR_II)) {
    monthName = 'אדר';
  }
  const yearGematriya = includeYear ? gematriya(hDate.getFullYear()) : '';
  return `${dayGematriya} ב${monthName}${includeYear ? ' ' + yearGematriya : ''}`;
}

// Format Gregorian date in Hebrew e.g. "19 באוקטובר 2026"
function formatGregorianDate(year, month, day, includeYear = true) {
  const mName = GREGORIAN_MONTH_NAMES_HE[month] || '';
  return `${day} ב${mName}${includeYear ? ' ' + year : ''}`;
}

// Calculate the Next Occurrence for any person record
function calculateNextOccurrence(person, customToday = null) {
  const today = customToday || getTodayInIsrael();
  const calType = (person.birthday && person.birthday.calendar) || person.dateType || person.reminderType || 'gregorian';

  if (calType === 'hebrew') {
    const rawDay = (person.birthday && person.birthday.day) || person.hebrewDay || 1;
    const rawMonth = (person.birthday && person.birthday.month) || person.hebrewMonth || 'תשרי';

    // Get current Hebrew year for today
    const todayGregDate = new Date(today.year, today.month - 1, today.day);
    const todayHDate = new HDate(todayGregDate);
    let hYear = todayHDate.getFullYear();

    let candidateHDate = createHDate(rawDay, rawMonth, hYear);
    let candidateGreg = candidateHDate.greg();
    let candidateYear = candidateGreg.getFullYear();
    let candidateMonth = candidateGreg.getMonth() + 1;
    let candidateDay = candidateGreg.getDate();

    let remaining = daysBetween(today, { year: candidateYear, month: candidateMonth, day: candidateDay });

    // If already passed this Hebrew year, roll over to next Hebrew year
    if (remaining < 0) {
      hYear += 1;
      candidateHDate = createHDate(rawDay, rawMonth, hYear);
      candidateGreg = candidateHDate.greg();
      candidateYear = candidateGreg.getFullYear();
      candidateMonth = candidateGreg.getMonth() + 1;
      candidateDay = candidateGreg.getDate();
      remaining = daysBetween(today, { year: candidateYear, month: candidateMonth, day: candidateDay });
    }

    const gregDateStr = `${candidateYear}-${String(candidateMonth).padStart(2, '0')}-${String(candidateDay).padStart(2, '0')}`;

    return {
      calendar: 'hebrew',
      sourceDay: rawDay,
      sourceMonth: rawMonth,
      gregorianDate: gregDateStr,
      gregorianDay: candidateDay,
      gregorianMonth: candidateMonth,
      gregorianYear: candidateYear,
      gregorianDisplay: formatGregorianDate(candidateYear, candidateMonth, candidateDay, true),
      gregorianShortDisplay: formatGregorianDate(candidateYear, candidateMonth, candidateDay, false),
      hebrewDay: candidateHDate.getDate(),
      hebrewMonth: candidateHDate.getMonth(),
      hebrewMonthName: HEBREW_MONTH_NAMES[candidateHDate.getMonth()],
      hebrewYear: candidateHDate.getFullYear(),
      hebrewDisplay: formatHebrewDate(candidateHDate, true),
      hebrewShortDisplay: formatHebrewDate(candidateHDate, false),
      daysRemaining: remaining,
      isToday: remaining === 0
    };
  } else {
    // Gregorian calendar
    const rawDay = (person.birthday && person.birthday.day) || person.day || 1;
    const rawMonth = (person.birthday && person.birthday.month) || person.month || 1;

    let targetYear = today.year;
    let remaining = daysBetween(today, { year: targetYear, month: rawMonth, day: rawDay });

    // If passed this year, roll over to next Gregorian year
    if (remaining < 0) {
      targetYear += 1;
      remaining = daysBetween(today, { year: targetYear, month: rawMonth, day: rawDay });
    }

    const gregDateStr = `${targetYear}-${String(rawMonth).padStart(2, '0')}-${String(rawDay).padStart(2, '0')}`;
    const occurrenceGregDate = new Date(targetYear, rawMonth - 1, rawDay);
    const occurrenceHDate = new HDate(occurrenceGregDate);

    return {
      calendar: 'gregorian',
      sourceDay: rawDay,
      sourceMonth: rawMonth,
      gregorianDate: gregDateStr,
      gregorianDay: rawDay,
      gregorianMonth: rawMonth,
      gregorianYear: targetYear,
      gregorianDisplay: formatGregorianDate(targetYear, rawMonth, rawDay, true),
      gregorianShortDisplay: formatGregorianDate(targetYear, rawMonth, rawDay, false),
      hebrewDay: occurrenceHDate.getDate(),
      hebrewMonth: occurrenceHDate.getMonth(),
      hebrewMonthName: HEBREW_MONTH_NAMES[occurrenceHDate.getMonth()],
      hebrewYear: occurrenceHDate.getFullYear(),
      hebrewDisplay: formatHebrewDate(occurrenceHDate, true),
      hebrewShortDisplay: formatHebrewDate(occurrenceHDate, false),
      daysRemaining: remaining,
      isToday: remaining === 0
    };
  }
}

// Enrich person record with fully calculated nextOccurrence
function enrichPersonRecord(person, customToday = null) {
  const next = calculateNextOccurrence(person, customToday);
  
  // Standardized birthday object
  const birthday = {
    calendar: next.calendar,
    day: next.sourceDay,
    month: next.sourceMonth
  };

  return {
    ...person,
    birthday,
    // Keep legacy fields synchronized so existing endpoints / bots remain 100% compatible
    dateType: next.calendar,
    reminderType: next.calendar,
    day: next.gregorianDay,
    month: next.gregorianMonth,
    hebrewDay: next.hebrewDay,
    hebrewMonth: next.hebrewMonthName,
    hebrewDateStr: next.hebrewShortDisplay,
    nextOccurrence: next
  };
}

// Convert Gregorian to Hebrew
function gregorianToHebrew(year, month, day) {
  const hd = new HDate(new Date(year, month - 1, day));
  return {
    hebrewDay: hd.getDate(),
    hebrewMonth: hd.getMonth(),
    hebrewMonthName: HEBREW_MONTH_NAMES[hd.getMonth()],
    hebrewYear: hd.getFullYear(),
    hebrewDisplay: formatHebrewDate(hd, true),
    hebrewShortDisplay: formatHebrewDate(hd, false)
  };
}

// Convert Hebrew to Gregorian
function hebrewToGregorian(hebrewDay, hebrewMonthInput, hebrewYear) {
  const hd = createHDate(hebrewDay, hebrewMonthInput, hebrewYear);
  const g = hd.greg();
  return {
    day: g.getDate(),
    month: g.getMonth() + 1,
    year: g.getFullYear(),
    gregorianDate: `${g.getFullYear()}-${String(g.getMonth() + 1).padStart(2, '0')}-${String(g.getDate()).padStart(2, '0')}`,
    gregorianDisplay: formatGregorianDate(g.getFullYear(), g.getMonth() + 1, g.getDate(), true),
    gregorianShortDisplay: formatGregorianDate(g.getFullYear(), g.getMonth() + 1, g.getDate(), false)
  };
}

// Enrich all records and sort by next occurrence (closest first)
function enrichAll(list, customToday = null) {
  if (!Array.isArray(list)) return [];
  const enriched = list.map(item => enrichPersonRecord(item, customToday));
  return enriched.sort((a, b) => a.nextOccurrence.daysRemaining - b.nextOccurrence.daysRemaining);
}

// Get all celebrants whose birthday is TODAY
function getTodayCelebrants(list, customToday = null) {
  const all = enrichAll(list, customToday);
  return all.filter(p => p.nextOccurrence.isToday);
}

module.exports = {
  getTodayInIsrael,
  daysBetween,
  createHDate,
  normalizeHebrewMonth,
  formatHebrewDate,
  formatGregorianDate,
  calculateNextOccurrence,
  enrichPersonRecord,
  enrichAll,
  getTodayCelebrants,
  gregorianToHebrew,
  hebrewToGregorian,
  toGematriya: gematriya,
  HEBREW_MONTH_NAMES,
  GREGORIAN_MONTH_NAMES_HE
};
