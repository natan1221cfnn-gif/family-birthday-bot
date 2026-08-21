const { parseHebrewDateString } = require('../lib/hebrewDateParser');
const { convertHebrewToGregorian, convertGregorianToHebrew } = require('../lib/hebrewCalendar');

const samples = [
  'י"ד תשרי',
  'ה כסלו',
  'טו בשבט',
  'ו שבט',
  'ד\' תמוז תש"ן',
  'יח\' אדר תשלד\'',
  'ב\' תמוז תשלב\'',
  'יז\' כסלו תשס\'ו',
  'יח\' כסלו תשסט\''
];

samples.forEach(s => {
  const p = parseHebrewDateString(s);
  const g = convertHebrewToGregorian(p.hebrewDay, p.hebrewMonth, p.hebrewYear || 5784);
  const h = convertGregorianToHebrew(g.day, g.month, p.hebrewYear ? g.year : undefined);
  console.log(s, '=> Day:', p.hebrewDay, 'Month:', p.hebrewMonth, 'Year:', p.hebrewYear, '=> Greg:', `${g.day}/${g.month}/${g.year}`, '=> Recon:', h.hebrewDateStr);
});
