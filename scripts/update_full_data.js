const fs = require('fs');
const path = require('path');
const { convertGregorianToHebrew } = require('../lib/hebrewCalendar');

const DEFAULT_FAMILY_BIRTHDAYS = [
  { name: "ורד דידי", relation: "הבת של נאוה", gender: "female", day: 27, month: 6, year: 1990, reminderType: "gregorian" },
  { name: "יוסי דידי", relation: "בעלה של ורד (הבת של נאוה)", gender: "male", day: 2, month: 4, year: 1991, reminderType: "gregorian" },
  { name: "ציון טהרני", relation: "משפחה", gender: "male", day: 7, month: 7, year: 1992, reminderType: "hebrew" },
  { name: "פנינה טהרני", relation: "הבת של נאוה", gender: "female", day: 21, month: 3, year: 1993, reminderType: "gregorian" },
  { name: "דנה כהן", relation: "הבת של נופת", gender: "female", day: 10, month: 7, year: 1993, reminderType: "hebrew" },
  { name: "יאיר עג'מי", relation: "הבן של ניצה", gender: "male", day: 20, month: 5, year: 1998, reminderType: "hebrew" },
  { name: "אודיה עג'מי", relation: "אשתו של יאיר (הבן של ניצה)", gender: "female", day: 4, month: 9, year: 1999, reminderType: "hebrew" },
  { name: "תמר דידי", relation: "הבת של ורד (הבת של נאוה)", gender: "female", day: 29, month: 10, year: 2013, reminderType: "gregorian" },
  { name: "יאיר דידי", relation: "הבן של ורד (הבת של נאוה)", gender: "male", day: 28, month: 7, year: 2016, reminderType: "gregorian" },
  { name: "עדי דידי", relation: "הבת של ורד (הבת של נאוה)", gender: "female", day: 23, month: 4, year: 2019, reminderType: "gregorian" },
  { name: "נועה דידי", relation: "הבת של ורד (הבת של נאוה)", gender: "female", day: 17, month: 1, year: 2022, reminderType: "gregorian" },
  { name: "הללי עג'מי", relation: "הבת של יאיר (הבן של ניצה)", gender: "female", day: 28, month: 7, year: 2022, reminderType: "hebrew" },
  { name: "הראל דידי", relation: "הבן של ורד (הבת של נאוה)", gender: "male", day: 18, month: 6, year: 2025, reminderType: "gregorian" },
  { name: "הדס דידי", relation: "הבת של ורד (הבת של נאוה)", gender: "female", day: 18, month: 6, year: 2025, reminderType: "gregorian" },
  { name: "אליה עג'מי", relation: "הבן של יאיר (הבן של ניצה)", gender: "male", day: 15, month: 9, year: 2025, reminderType: "hebrew" },
  { name: "אריאל דוד יצחקוב", relation: "הבן של נופת", gender: "male", day: 7, month: 6, year: 2010, reminderType: "hebrew" },
  { name: "אלעזר אוריין", relation: "בעלה של יסכה (הבת של ניצה)", gender: "male", day: 17, month: 11, year: 2003, reminderType: "hebrew" },
  { name: "יסכה אוריין", relation: "הבת של ניצה", gender: "female", day: 21, month: 4, year: 2003, reminderType: "hebrew" },
  { name: "עמוס כהן", relation: "בעלה של דנה (הבת של נופת)", gender: "male", day: 30, month: 12, year: 1992, reminderType: "hebrew" },
  { name: "יעל כהן", relation: "הבת של דנה (הבת של נופת)", gender: "female", day: 19, month: 10, year: 2022, reminderType: "hebrew" },
  { name: "יסכה כהן", relation: "הבת של דנה (הבת של נופת)", gender: "female", day: 1, month: 2, year: 2025, reminderType: "hebrew" },
  { name: "נעם עג'מי", relation: "הבן של ניצה", gender: "male", day: 12, month: 6, year: 1995, reminderType: "hebrew" },
  { name: "אוריה עג'מי", relation: "אשתו של נעם", gender: "female", day: 3, month: 3, year: 1995, reminderType: "hebrew" },
  { name: "רני עג'מי", relation: "הבת של נעם ואוריה", gender: "female", day: 25, month: 6, year: 2026, reminderType: "hebrew" },
  { name: "זגדון יקירה", relation: "אשת אלישע", gender: "female", day: 24, month: 11, reminderType: "hebrew" },
  { name: "יערה זגדון", relation: "הבת של אלישע", gender: "female", day: 25, month: 1, reminderType: "hebrew" },
  { name: "אמיר זגדון", relation: "בן של אלישע", gender: "male", day: 16, month: 1, reminderType: "hebrew" },
  { name: "אלישע זגדון", relation: "בן של סבתא רחל וסבא כדיר", gender: "male", day: 1, month: 10, reminderType: "hebrew" }
].map((m, idx) => {
  const hebInfo = convertGregorianToHebrew(m.day, m.month, m.year);
  return {
    id: `bday_${idx + 1}_${m.name.replace(/\s+/g, '_')}`,
    name: m.name,
    gender: m.gender || 'unspecified',
    day: m.day,
    month: m.month,
    year: m.year || undefined,
    hebrewDay: hebInfo.hebrewDay,
    hebrewMonth: hebInfo.hebrewMonth,
    hebrewMonthName: hebInfo.hebrewMonthName,
    hebrewDateStr: hebInfo.hebrewDateStr,
    hebrewYear: hebInfo.hebrewYear,
    reminderType: m.reminderType || 'gregorian',
    relation: m.relation,
    customWish: "",
    createdAt: new Date().toISOString()
  };
});

const targetPath = path.join(__dirname, '..', 'data', 'birthdays.json');
fs.writeFileSync(targetPath, JSON.stringify(DEFAULT_FAMILY_BIRTHDAYS, null, 2), 'utf8');
console.log(`✅ data/birthdays.json עודכן בהצלחה עם ${DEFAULT_FAMILY_BIRTHDAYS.length} רשומות!`);
