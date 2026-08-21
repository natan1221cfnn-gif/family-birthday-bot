const assert = require('assert');
const dateService = require('../lib/dateService');
const bot = require('../bot');
const { HDate, months } = require('@hebcal/core');

console.log('===============================================================');
console.log('🎯 בדיקת אימות ממוקדת לפי דרישות המשתמש');
console.log('===============================================================\n');

// -----------------------------------------------------------------------------
// חלק 1: WhatsApp — בדיקה לפי סוג הלוח המקורי
// -----------------------------------------------------------------------------
console.log('📌 חלק 1: בדיקת תזמון WhatsApp לפי סוג הלוח המקורי (SSOT)');

// משתמש א': תאריך לועזי - 19 באוקטובר
const userGregorian = {
  id: 'test_greg_19_oct',
  name: 'רון לועזי',
  gender: 'male',
  customWish: 'שפע הצלחה!',
  birthday: { calendar: 'gregorian', day: 19, month: 10 }
};

// משתמש ב': תאריך עברי - כ"ד בתשרי
const userHebrew = {
  id: 'test_heb_24_tishrei',
  name: 'מיכל עברי',
  gender: 'female',
  customWish: 'אושר ובריאות!',
  birthday: { calendar: 'hebrew', day: 24, month: 'תשרי' }
};

const familyList = [userGregorian, userHebrew];

// בדיקה 1.1: תאריך 19 באוקטובר 2026
// ביום זה: רון (לועזי) חוגג. מיכל (עברי) לא חוגגת (כי כ"ד בתשרי 5787 חל ב-5 באוקטובר).
const day_19_oct_2026 = { year: 2026, month: 10, day: 19 };
const celebrants_19_oct_2026 = dateService.getTodayCelebrants(familyList, day_19_oct_2026);

console.log('  🗓️  בדיקה ביום 19/10/2026:');
console.log(`     חוגגים שנמצאו: ${celebrants_19_oct_2026.map(c => c.name).join(', ')}`);
assert.strictEqual(celebrants_19_oct_2026.length, 1);
assert.strictEqual(celebrants_19_oct_2026[0].id, 'test_greg_19_oct');
console.log('     ✅ רון (19 באוקטובר) חוגג ב-19 באוקטובר 2026!');

// בדיקה 1.2: תאריך 19 באוקטובר 2027
// ביום זה: רון (לועזי) שוב חוגג ב-19 באוקטובר.
const day_19_oct_2027 = { year: 2027, month: 10, day: 19 };
const celebrants_19_oct_2027 = dateService.getTodayCelebrants(familyList, day_19_oct_2027);

console.log('  🗓️  בדיקה ביום 19/10/2027:');
console.log(`     חוגגים שנמצאו: ${celebrants_19_oct_2027.map(c => c.name).join(', ')}`);
assert.strictEqual(celebrants_19_oct_2027.length, 1);
assert.strictEqual(celebrants_19_oct_2027[0].id, 'test_greg_19_oct');
console.log('     ✅ רון (19 באוקטובר) חוגג שוב בדיוק ב-19 באוקטובר 2027!');

// בדיקה 1.3: כ"ד בתשרי בשנת תשפ"ז (2026) -> חל ב-5 באוקטובר 2026
const day_24_tishrei_5787 = { year: 2026, month: 10, day: 5 };
const celebrants_5787 = dateService.getTodayCelebrants(familyList, day_24_tishrei_5787);

console.log('  🗓️  בדיקה ביום 05/10/2026 (כ"ד בתשרי תשפ"ז):');
console.log(`     חוגגים שנמצאו: ${celebrants_5787.map(c => c.name).join(', ')}`);
assert.strictEqual(celebrants_5787.length, 1);
assert.strictEqual(celebrants_5787[0].id, 'test_heb_24_tishrei');
console.log('     ✅ מיכל (כ"ד בתשרי) חוגגת ב-5 באוקטובר 2026!');

// בדיקה 1.4: כ"ד בתשרי בשנת תשפ"ח (2027) -> חל ב-25 באוקטובר 2027 (חישוב דינמי, לא סטטי!)
const day_24_tishrei_5788 = { year: 2027, month: 10, day: 25 };
const celebrants_5788 = dateService.getTodayCelebrants(familyList, day_24_tishrei_5788);

console.log('  🗓️  בדיקה ביום 25/10/2027 (כ"ד בתשרי תשפ"ח):');
console.log(`     חוגגים שנמצאו: ${celebrants_5788.map(c => c.name).join(', ')}`);
assert.strictEqual(celebrants_5788.length, 1);
assert.strictEqual(celebrants_5788[0].id, 'test_heb_24_tishrei');
console.log('     ✅ מיכל (כ"ד בתשרי) חוגגת ב-25 באוקטובר 2027 (חישוב עברי דינמי)!');

// בדיקה 1.5: כ"ד בתשרי בשנת תשפ"ט (2028) -> חל ב-14 באוקטובר 2028
const day_24_tishrei_5789 = { year: 2028, month: 10, day: 14 };
const celebrants_5789 = dateService.getTodayCelebrants(familyList, day_24_tishrei_5789);

console.log('  🗓️  בדיקה ביום 14/10/2028 (כ"ד בתשרי תשפ"ט):');
console.log(`     חוגגים שנמצאו: ${celebrants_5789.map(c => c.name).join(', ')}`);
assert.strictEqual(celebrants_5789.length, 1);
assert.strictEqual(celebrants_5789[0].id, 'test_heb_24_tishrei');
console.log('     ✅ מיכל (כ"ד בתשרי) חוגגת ב-14 באוקטובר 2028 (חישוב עברי דינמי)!');


// -----------------------------------------------------------------------------
// חלק 2: אדר — בדיקת הכללים העסקיים המפורשים
// -----------------------------------------------------------------------------
console.log('\n📌 חלק 2: בדיקת הכלל העסקי המפורש לחודש אדר (מעוברת / פשוטה)');

/*
  כלל עסקי מוגדר במערכת:
  1. "אדר" (סתם אדר):
     - בשנה פשוטה: נחגג בחודש אדר (חודש 12).
     - בשנה מעוברת: נחגג בחודש אדר ב' (חודש 13 - עיקר החודש לפי ההלכה).
  2. "אדר א'":
     - בשנה מעוברת: נחגג בחודש אדר א' (חודש 12).
     - בשנה פשוטה: נחגג בחודש אדר (חודש 12).
  3. "אדר ב'":
     - בשנה מעוברת: נחגג בחודש אדר ב' (חודש 13).
     - בשנה פשוטה: נחגג בחודש אדר (חודש 12).
*/

const pAdarPlain = { name: 'דני (אדר)', birthday: { calendar: 'hebrew', day: 14, month: 'אדר' } };
const pAdar1 = { name: 'יוסי (אדר א)', birthday: { calendar: 'hebrew', day: 14, month: "אדר א'" } };
const pAdar2 = { name: 'שרה (אדר ב)', birthday: { calendar: 'hebrew', day: 14, month: "אדר ב'" } };

// שנה מעוברת: תשפ"ד (5784)
assert.strictEqual(HDate.isLeapYear(5784), true);
console.log('  🔍 בדיקה בשנת תשפ"ד (שנה מעוברת):');

const occPlain_5784 = dateService.calculateNextOccurrence(pAdarPlain, { year: 2024, month: 1, day: 1 });
console.log(`     • "י"ד באדר" -> חודש: ${occPlain_5784.hebrewMonthName}, תאריך: ${occPlain_5784.hebrewDisplay} (לועזי: ${occPlain_5784.gregorianDisplay})`);
assert.strictEqual(occPlain_5784.hebrewMonth, months.ADAR_II, 'סתם אדר בשנה מעוברת חייב להיחגג באדר ב');
assert.strictEqual(occPlain_5784.gregorianDate, '2024-03-24');

const occAdar1_5784 = dateService.calculateNextOccurrence(pAdar1, { year: 2024, month: 1, day: 1 });
console.log(`     • "י"ד באדר א'" -> חודש: ${occAdar1_5784.hebrewMonthName}, תאריך: ${occAdar1_5784.hebrewDisplay} (לועזי: ${occAdar1_5784.gregorianDisplay})`);
assert.strictEqual(occAdar1_5784.hebrewMonth, months.ADAR_I, 'אדר א בשנה מעוברת חייב להיחגג באדר א');
assert.strictEqual(occAdar1_5784.gregorianDate, '2024-02-23');

const occAdar2_5784 = dateService.calculateNextOccurrence(pAdar2, { year: 2024, month: 1, day: 1 });
console.log(`     • "י"ד באדר ב'" -> חודש: ${occAdar2_5784.hebrewMonthName}, תאריך: ${occAdar2_5784.hebrewDisplay} (לועזי: ${occAdar2_5784.gregorianDisplay})`);
assert.strictEqual(occAdar2_5784.hebrewMonth, months.ADAR_II, 'אדר ב בשנה מעוברת חייב להיחגג באדר ב');
assert.strictEqual(occAdar2_5784.gregorianDate, '2024-03-24');

// שנה פשוטה: תשפ"ה (5785)
assert.strictEqual(HDate.isLeapYear(5785), false);
console.log('  🔍 בדיקה בשנת תשפ"ה (שנה פשוטה):');

const occPlain_5785 = dateService.calculateNextOccurrence(pAdarPlain, { year: 2025, month: 1, day: 1 });
console.log(`     • "י"ד באדר" -> חודש: ${occPlain_5785.hebrewMonthName}, תאריך: ${occPlain_5785.hebrewDisplay} (לועזי: ${occPlain_5785.gregorianDisplay})`);
assert.strictEqual(occPlain_5785.hebrewMonth, months.ADAR_I, 'סתם אדר בשנה פשוטה נחגג באדר יחיד');
assert.strictEqual(occPlain_5785.gregorianDate, '2025-03-14');

const occAdar1_5785 = dateService.calculateNextOccurrence(pAdar1, { year: 2025, month: 1, day: 1 });
console.log(`     • "י"ד באדר א'" -> חודש: ${occAdar1_5785.hebrewMonthName}, תאריך: ${occAdar1_5785.hebrewDisplay} (לועזי: ${occAdar1_5785.gregorianDisplay})`);
assert.strictEqual(occAdar1_5785.hebrewMonth, months.ADAR_I, 'אדר א בשנה פשוטה נחגג באדר יחיד');
assert.strictEqual(occAdar1_5785.gregorianDate, '2025-03-14');

const occAdar2_5785 = dateService.calculateNextOccurrence(pAdar2, { year: 2025, month: 1, day: 1 });
console.log(`     • "י"ד באדר ב'" -> חודש: ${occAdar2_5785.hebrewMonthName}, תאריך: ${occAdar2_5785.hebrewDisplay} (לועזי: ${occAdar2_5785.gregorianDisplay})`);
assert.strictEqual(occAdar2_5785.hebrewMonth, months.ADAR_I, 'אדר ב בשנה פשוטה נחגג באדר יחיד');
assert.strictEqual(occAdar2_5785.gregorianDate, '2025-03-14');
console.log('  ✅ כל כללי אדר בשנה פשוטה ומעוברת אומתו ב-100%!');


// -----------------------------------------------------------------------------
// חלק 3: בדיקת סימולציה מלאה End-to-End מקצה לקצה
// -----------------------------------------------------------------------------
console.log('\n📌 חלק 3: סימולציית End-to-End מלאה של המערכת האמיתית');

const mockConfig = {
  groupName: 'משפחה',
  notificationHour: 8,
  notificationMinute: 30,
  messageTemplate: '🎉 *יום הולדת שמח!* 🎉\n\nהמון מזל טוב *ל{name}* {greetingHonor} יום הולדת! 🎂🎈\n\n💬 *ברכה:*\n"{wishText}"\n\nאוהבים, המשפחה! 💐'
};

// סימולציה למשתמש לועזי (19 באוקטובר)
console.log('\n--- 1. משתמש לועזי: 19 באוקטובר ---');
const simGregRaw = {
  id: 'sim_greg_1',
  name: 'יוסי כהן',
  gender: 'male',
  relation: 'בן דוד',
  customWish: 'שפע ברכה והצלחה בכל מעשי ידיך!',
  birthday: { calendar: 'gregorian', day: 19, month: 10 }
};

// שלב 1: חישוב בשרת בעת קריאת הנתונים
const refDate1 = { year: 2026, month: 8, day: 21 }; // היום
const simGregEnriched = dateService.enrichPersonRecord(simGregRaw, refDate1);

console.log('1. נתוני הכרטיסייה (Frontend Card Data):');
console.log(`   • שם: ${simGregEnriched.name} (${simGregEnriched.relation})`);
console.log(`   • תאריך לועזי להצגה: 📅 ${simGregEnriched.nextOccurrence.gregorianShortDisplay}`);
console.log(`   • תאריך עברי מסונכרן: 📜 ${simGregEnriched.nextOccurrence.hebrewShortDisplay}`);
console.log(`   • ימים שנותרו: עוד ${simGregEnriched.nextOccurrence.daysRemaining} ימים`);

assert.strictEqual(simGregEnriched.nextOccurrence.gregorianShortDisplay, '19 באוקטובר');
assert.strictEqual(simGregEnriched.nextOccurrence.hebrewShortDisplay, 'ח׳ בחשוון');
assert.strictEqual(simGregEnriched.nextOccurrence.daysRemaining, 59);

// שלב 2: ביום יום ההולדת (19 באוקטובר) בדיקת WhatsApp
const bdayGregDate = { year: 2026, month: 10, day: 19 };
const todayCelebrantsGreg = dateService.getTodayCelebrants([simGregRaw], bdayGregDate);
assert.strictEqual(todayCelebrantsGreg.length, 1);
assert.strictEqual(todayCelebrantsGreg[0].nextOccurrence.isToday, true);

const waMsgGreg = bot.formatGreetingMessage(mockConfig.messageTemplate, todayCelebrantsGreg[0]);
console.log('2. הודעת ה-WhatsApp שנשלחת ב-19/10/2026:');
console.log('----------------------------------------------------');
console.log(waMsgGreg);
console.log('----------------------------------------------------');
assert.ok(waMsgGreg.includes('*ליוסי כהן*'));
assert.ok(waMsgGreg.includes('היקר שחוגג היום'));
assert.ok(waMsgGreg.includes('שפע ברכה והצלחה בכל מעשי ידיך!'));


// סימולציה למשתמש עברי (כ"ד בתשרי)
console.log('\n--- 2. משתמש עברי: כ"ד בתשרי ---');
const simHebRaw = {
  id: 'sim_heb_1',
  name: 'יעל לוי',
  gender: 'female',
  relation: 'אחות',
  customWish: 'אושר, בריאות ואור גדול תמיד!',
  birthday: { calendar: 'hebrew', day: 24, month: 'תשרי' }
};

// שלב 1: חישוב בשרת בעת קריאת הנתונים
const simHebEnriched = dateService.enrichPersonRecord(simHebRaw, refDate1);

console.log('1. נתוני הכרטיסייה (Frontend Card Data):');
console.log(`   • שם: ${simHebEnriched.name} (${simHebEnriched.relation})`);
console.log(`   • תאריך עברי להצגה: 📜 ${simHebEnriched.nextOccurrence.hebrewShortDisplay}`);
console.log(`   • תאריך לועזי מסונכרן: 📅 ${simHebEnriched.nextOccurrence.gregorianShortDisplay}`);
console.log(`   • ימים שנותרו: עוד ${simHebEnriched.nextOccurrence.daysRemaining} ימים`);

assert.strictEqual(simHebEnriched.nextOccurrence.hebrewShortDisplay, 'כ״ד בתשרי');
assert.strictEqual(simHebEnriched.nextOccurrence.gregorianShortDisplay, '5 באוקטובר');
assert.strictEqual(simHebEnriched.nextOccurrence.daysRemaining, 45);

// שלב 2: ביום יום ההולדת (5 באוקטובר 2026 - כ"ד בתשרי) בדיקת WhatsApp
const bdayHebDate = { year: 2026, month: 10, day: 5 };
const todayCelebrantsHeb = dateService.getTodayCelebrants([simHebRaw], bdayHebDate);
assert.strictEqual(todayCelebrantsHeb.length, 1);
assert.strictEqual(todayCelebrantsHeb[0].nextOccurrence.isToday, true);

const waMsgHeb = bot.formatGreetingMessage(mockConfig.messageTemplate, todayCelebrantsHeb[0]);
console.log('2. הודעת ה-WhatsApp שנשלחת ב-05/10/2026 (כ"ד בתשרי תשפ"ז):');
console.log('----------------------------------------------------');
console.log(waMsgHeb);
console.log('----------------------------------------------------');
assert.ok(waMsgHeb.includes('*ליעל לוי*'));
assert.ok(waMsgHeb.includes('היקרה שחוגגת היום'));
assert.ok(waMsgHeb.includes('אושר, בריאות ואור גדול תמיד!'));

console.log('\n===============================================================');
console.log('🏆 כל 3 הבדיקות הממוקדות עברו בהצלחה מושלמת ללא רבב!');
console.log('===============================================================\n');
