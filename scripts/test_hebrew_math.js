// Standard verified Jewish Calendar Algorithm

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
  // 1. Molad Zaken (noon or later)
  if (parts >= 19440) {
    day += 1;
  }

  // Check day of week (0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday)
  let dow = day % 7;

  // 2. Lo ADU Rosh: Sunday (0), Wednesday (3), Friday (5)
  if (dow === 0 || dow === 3 || dow === 5) {
    day += 1;
  } else if (dow === 2 && parts >= 9924 && !isHebrewLeapYear(year)) {
    // 3. GaTaRad in regular year: Tuesday at 9h 204p or later -> Thursday
    day += 2;
  } else if (dow === 1 && parts >= 16789 && isHebrewLeapYear(year - 1)) {
    // 4. BeTuTaKTaF in year after leap: Monday at 15h 589p or later -> Tuesday
    day += 1;
  }

  // Epoch Julian Day Number (Hebrew Day 1 = JDN 347997)
  return day + 347997;
}

function getDaysInHebrewYear(year) {
  return hebrewRoshHashanaJdn(year + 1) - hebrewRoshHashanaJdn(year);
}

function getDaysInHebrewMonth(year, monthIndex) {
  // monthIndex 0..11 (or 0..12 in leap):
  // 0: Tishrei, 1: Cheshvan, 2: Kislev, 3: Tevet, 4: Shvat, 5: Adar I, 6: Adar II, 7: Nisan, 8: Iyyar, 9: Sivan, 10: Tamuz, 11: Av, 12: Elul
  const isLeap = isHebrewLeapYear(year);
  const yearLength = getDaysInHebrewYear(year);

  // Month 0: Tishrei = 30
  if (monthIndex === 0) return 30;
  // Month 1: Cheshvan (355 or 385 has 30, otherwise 29)
  if (monthIndex === 1) return (yearLength === 355 || yearLength === 385) ? 30 : 29;
  // Month 2: Kislev (353 or 383 has 29, otherwise 30)
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

// Convert Hebrew Date to Gregorian
function hebToGreg(hebrewDay, hebrewMonthName, hebrewYear) {
  const isLeap = isHebrewLeapYear(hebrewYear);
  const monthNames = isLeap
    ? ["תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר א'", "אדר ב'", "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"]
    : ["תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר", "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"];

  let mIndex = monthNames.indexOf(hebrewMonthName);
  if (mIndex === -1) mIndex = 0;

  let jdn = hebrewRoshHashanaJdn(hebrewYear);
  for (let i = 0; i < mIndex; i++) {
    jdn += getDaysInHebrewMonth(hebrewYear, i);
  }
  jdn += (hebrewDay - 1);
  return julianToGregorian(jdn);
}

// Convert Gregorian to Hebrew Date
function gregToHeb(day, month, year) {
  const jdn = gregorianToJulian(year, month, day);

  let hYear = year + 3760;
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

  return {
    hebrewDay: daysSinceRH + 1,
    hebrewMonth: monthNames[mIndex],
    hebrewYear: hYear
  };
}

console.log('Testing Exact Hebrew Calendar Math:');
console.log('1 Tishrei 5784 ->', hebToGreg(1, 'תשרי', 5784), '(Expected: 16/9/2023)');
console.log('14 Tishrei 5784 ->', hebToGreg(14, 'תשרי', 5784), '(Expected: 29/9/2023)');
console.log('29/9/2023 ->', gregToHeb(29, 9, 2023), '(Expected: 14 Tishrei 5784)');
console.log('27/6/1990 ->', gregToHeb(27, 6, 1990), '(Expected: 4 Tamuz 5750)');
console.log('4 Tamuz 5750 ->', hebToGreg(4, 'תמוז', 5750), '(Expected: 27/6/1990)');
console.log('8 Kislev 5783 ->', hebToGreg(8, 'כסלו', 5783), '(Expected: 2/12/2022)');
console.log('2/12/2022 ->', gregToHeb(2, 12, 2022), '(Expected: 8 Kislev 5783)');
