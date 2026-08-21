const fs = require('fs');
const path = require('path');

const familyMembers = [
  {
    name: "ורד דידי",
    relation: "הבת של נאוה",
    day: 27,
    month: 6,
    year: 1990
  },
  {
    name: "יוסי דידי",
    relation: "בעלה של ורד (הבת של נאוה)",
    day: 2,
    month: 4,
    year: 1991
  },
  {
    name: "ציון טהרני",
    relation: "משפחה",
    day: 7,
    month: 7,
    year: 1992
  },
  {
    name: "פנינה טהרני",
    relation: "הבת של נאוה",
    day: 21,
    month: 3,
    year: 1993
  },
  {
    name: "דנה כהן",
    relation: "הבת של נופת",
    day: 10,
    month: 7,
    year: 1993
  },
  {
    name: "יאיר עג'מי",
    relation: "הבן של ניצה",
    day: 20,
    month: 5,
    year: 1998
  },
  {
    name: "אודיה עג'מי",
    relation: "אשתו של יאיר (הבן של ניצה)",
    day: 4,
    month: 9,
    year: 1999
  },
  {
    name: "תמר דידי",
    relation: "הבת של ורד (הבת של נאוה)",
    day: 29,
    month: 10,
    year: 2013
  },
  {
    name: "יאיר דידי",
    relation: "הבן של ורד (הבת של נאוה)",
    day: 28,
    month: 7,
    year: 2016
  },
  {
    name: "עדי דידי",
    relation: "הבת של ורד (הבת של נאוה)",
    day: 23,
    month: 4,
    year: 2019
  },
  {
    name: "נועה דידי",
    relation: "הבת של ורד (הבת של נאוה)",
    day: 17,
    month: 1,
    year: 2022
  },
  {
    name: "הללי עג'מי",
    relation: "הבת של יאיר (הבן של ניצה)",
    day: 28,
    month: 7,
    year: 2022
  },
  {
    name: "הראל דידי",
    relation: "הבן של ורד (הבת של נאוה)",
    day: 18,
    month: 6,
    year: 2025
  },
  {
    name: "הדס דידי",
    relation: "הבת של ורד (הבת של נאוה)",
    day: 18,
    month: 6,
    year: 2025
  },
  {
    name: "אליה עג'מי",
    relation: "הבן של יאיר (הבן של ניצה)",
    day: 15,
    month: 9,
    year: 2025
  },
  {
    name: "אריאל דוד יצחקוב",
    relation: "הבן של נופת",
    day: 7,
    month: 6,
    year: 2010
  },
  {
    name: "אלעזר אוריין",
    relation: "בעלה של יסכה (הבת של ניצה)",
    day: 17,
    month: 11,
    year: 2003
  },
  {
    name: "יסכה אוריין",
    relation: "הבת של ניצה",
    day: 21,
    month: 4,
    year: 2003
  },
  {
    name: "עמוס כהן",
    relation: "בעלה של דנה (הבת של נופת)",
    day: 30,
    month: 12,
    year: 1992
  },
  {
    name: "יעל כהן",
    relation: "הבת של דנה (הבת של נופת)",
    day: 19,
    month: 10,
    year: 2022
  },
  {
    name: "יסכה כהן",
    relation: "הבת של דנה (הבת של נופת)",
    day: 1,
    month: 2,
    year: 2025
  },
  {
    name: "נעם עג'מי",
    relation: "הבן של ניצה",
    day: 12,
    month: 6,
    year: 1995
  },
  {
    name: "אוריה עג'מי",
    relation: "אשתו של נעם",
    day: 3,
    month: 3,
    year: 1995
  },
  {
    name: "רני עג'מי",
    relation: "הבת של נעם ואוריה",
    day: 25,
    month: 6,
    year: 2026
  },
  {
    name: "זגדון יקירה",
    relation: "אשת אלישע",
    day: 24,
    month: 11
  },
  {
    name: "יערה זגדון",
    relation: "הבת של אלישע",
    day: 25,
    month: 1
  },
  {
    name: "אמיר זגדון",
    relation: "בן של אלישע",
    day: 16,
    month: 1
  },
  {
    name: "אלישע זגדון",
    relation: "בן של סבתא רחל וסבא כדיר",
    day: 1,
    month: 10
  }
];

const processed = familyMembers.map((m, idx) => ({
  id: `bday_import_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
  name: m.name,
  day: m.day,
  month: m.month,
  year: m.year || undefined,
  relation: m.relation,
  customWish: "",
  createdAt: new Date().toISOString()
}));

const targetPath = path.join(__dirname, '..', 'data', 'birthdays.json');
fs.writeFileSync(targetPath, JSON.stringify(processed, null, 2), 'utf8');

console.log(`✅ הוזרקו בהצלחה ${processed.length} רשומות לתוך data/birthdays.json!`);
