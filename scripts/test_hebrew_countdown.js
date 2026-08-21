const { convertGregorianToHebrew, convertHebrewToGregorian } = require('../lib/hebrewCalendar');

// Today is August 20, 2026 -> 7 Elul 5786
const now = new Date();
const todayHeb = convertGregorianToHebrew(now.getDate(), now.getMonth() + 1, now.getFullYear());
console.log('Today Heb:', todayHeb);

// Test person: 21 Av (כ"א באב)
const targetHebDay = 21;
const targetHebMonth = 'אב';

// This Hebrew year (5786):
const gregThisYear = convertHebrewToGregorian(targetHebDay, targetHebMonth, todayHeb.hebrewYear);
console.log('21 Av 5786 was on:', gregThisYear);

const dateThisYear = new Date(gregThisYear.year, gregThisYear.month - 1, gregThisYear.day);
const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

console.log('dateThisYear:', dateThisYear.toISOString(), 'todayMidnight:', todayMidnight.toISOString());
console.log('Already passed this Hebrew year?', dateThisYear < todayMidnight);

// Next Hebrew year (5787):
const gregNextYear = convertHebrewToGregorian(targetHebDay, targetHebMonth, todayHeb.hebrewYear + 1);
console.log('21 Av 5787 will be on:', gregNextYear);

const dateNextYear = new Date(gregNextYear.year, gregNextYear.month - 1, gregNextYear.day);
const diffTime = dateNextYear.getTime() - todayMidnight.getTime();
const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
console.log('Days until next Hebrew birthday (in 5787):', diffDays);
