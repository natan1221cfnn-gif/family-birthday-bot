const fs = require('fs');
const path = require('path');
const dateService = require('../lib/dateService');

const BIRTHDAYS_FILE = path.join(__dirname, '..', 'data', 'birthdays.json');
const existingList = JSON.parse(fs.readFileSync(BIRTHDAYS_FILE, 'utf8'));

const newPeople = [
  {
    name: "אורית אלימלך",
    relation: "הבת של נאוה",
    gender: "female",
    birthday: { calendar: "gregorian", day: 1, month: 11 }
  },
  {
    name: "אביהו אלימלך",
    relation: "בעלה של אורית(הבת של נאוה)",
    gender: "male",
    birthday: { calendar: "gregorian", day: 4, month: 2 }
  },
  {
    name: "איתי אלימלך",
    relation: "בן של אורית(בת של נאוה)",
    gender: "male",
    birthday: { calendar: "gregorian", day: 25, month: 12 }
  },
  {
    name: "נווה אלימלך",
    relation: "בן של אורית(בת של נאוה)",
    gender: "male",
    birthday: { calendar: "gregorian", day: 30, month: 11 }
  },
  {
    name: "נריה אלימלך",
    relation: "בן של אורית(בת של נאוה)",
    gender: "male",
    birthday: { calendar: "gregorian", day: 1, month: 11 }
  },
  {
    name: "גבריאל יצחקוב",
    relation: "הבן של נופת",
    gender: "male",
    birthday: { calendar: "hebrew", day: 17, month: "חשוון" }
  },
  {
    name: "בתאל יצחקוב",
    relation: "הבת של נופת",
    gender: "female",
    birthday: { calendar: "hebrew", day: 16, month: "טבת" }
  },
  {
    name: "מנחם יצחקוב",
    relation: "הבן של נופת",
    gender: "male",
    birthday: { calendar: "hebrew", day: 8, month: "שבט" }
  },
  {
    name: "מיכאל יצחקוב",
    relation: "הבן של נופת",
    gender: "male",
    birthday: { calendar: "hebrew", day: 22, month: "שבט" }
  },
  {
    name: "דניאל יצחקוב",
    relation: "הבן של נופת",
    gender: "male",
    birthday: { calendar: "hebrew", day: 3, month: "ניסן" }
  },
  {
    name: "הודיה יצחקוב",
    relation: "הבת של נופת",
    gender: "female",
    birthday: { calendar: "hebrew", day: 11, month: "ניסן" }
  },
  {
    name: "מיכל יצחקוב",
    relation: "הבת של נופת",
    gender: "female",
    birthday: { calendar: "hebrew", day: 6, month: "אייר" }
  },
  {
    name: "נועה יצחקוב",
    relation: "הבת של נופת",
    gender: "female",
    birthday: { calendar: "hebrew", day: 5, month: "תמוז" }
  },
  {
    name: "יאיר יצחקוב",
    relation: "הבן של נופת",
    gender: "male",
    birthday: { calendar: "hebrew", day: 27, month: "חשוון" }
  },
  {
    name: "נועם יצחקוב",
    relation: "הבן של נופת",
    gender: "male",
    birthday: { calendar: "hebrew", day: 29, month: "סיוון" }
  },
  {
    name: "חגי יצחקוב",
    relation: "הבן של נופת",
    gender: "male",
    birthday: { calendar: "hebrew", day: 13, month: "אלול" }
  },
  {
    name: "אפרת יצחקוב",
    relation: "הבת של נופת",
    gender: "female",
    birthday: { calendar: "hebrew", day: 23, month: "אלול" }
  },
  {
    name: "אדל",
    relation: "הבת של אבי",
    gender: "female",
    birthday: { calendar: "hebrew", day: 22, month: "אלול" }
  },
  {
    name: "עדי",
    relation: "הבת של אבי",
    gender: "female",
    birthday: { calendar: "hebrew", day: 23, month: "תמוז" }
  },
  {
    name: "איתן",
    relation: "הבן של אבי",
    gender: "male",
    birthday: { calendar: "hebrew", day: 10, month: "חשוון" }
  },
  {
    name: "ז'אנה",
    relation: "אשתו של אבי",
    gender: "female",
    birthday: { calendar: "hebrew", day: 9, month: "אב" }
  },
  {
    name: "אבי",
    relation: "בן של סבתא רחל",
    gender: "male",
    birthday: { calendar: "hebrew", day: 10, month: "שבט" }
  }
];

let addedCount = 0;

for (const p of newPeople) {
  // Check if already exists in existingList by name
  const exists = existingList.find(e => e.name.trim() === p.name.trim());
  if (!exists) {
    const enriched = dateService.enrichPersonRecord({
      name: p.name,
      relation: p.relation,
      gender: p.gender,
      birthday: p.birthday
    });

    const sanitizedId = `bday_${Date.now()}_${p.name.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '_')}`;

    const newRecord = {
      id: sanitizedId,
      name: p.name,
      gender: p.gender,
      relation: p.relation,
      customWish: "",
      birthday: p.birthday,
      day: enriched.nextOccurrence.gregorianDay,
      month: enriched.nextOccurrence.gregorianMonth,
      hebrewDay: enriched.nextOccurrence.hebrewDay,
      hebrewMonth: enriched.nextOccurrence.hebrewMonthName,
      hebrewDateStr: enriched.nextOccurrence.hebrewShortDisplay,
      reminderType: p.birthday.calendar === 'hebrew' ? 'hebrew' : 'gregorian',
      createdAt: new Date().toISOString()
    };

    existingList.push(newRecord);
    addedCount++;
    console.log(`✅ נוסף: ${p.name} (${p.birthday.calendar === 'hebrew' ? p.birthday.day + ' ' + p.birthday.month : p.birthday.day + '/' + p.birthday.month})`);
  } else {
    console.log(`ℹ️ כבר קיים: ${p.name}`);
  }
}

fs.writeFileSync(BIRTHDAYS_FILE, JSON.stringify(existingList, null, 2), 'utf8');
console.log(`\n🎉 סה"כ נוספו בהצלחה ${addedCount} אנשים חדשים! סה"כ רשומים עכשיו: ${existingList.length}`);
