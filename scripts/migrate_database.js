const fs = require('fs');
const path = require('path');
const dateService = require('../lib/dateService');

const dataPath = path.join(__dirname, '..', 'data', 'birthdays.json');
const list = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log(`Original records count: ${list.length}`);

const migrated = list.map(item => {
  const isHebrew = (item.reminderType === 'hebrew' || item.dateType === 'hebrew' || (item.birthday && item.birthday.calendar === 'hebrew'));
  
  let bDay, bMonth;
  if (isHebrew) {
    bDay = (item.birthday && item.birthday.day) || item.hebrewDay || 1;
    bMonth = (item.birthday && item.birthday.month) || item.hebrewMonth || 'תשרי';
  } else {
    bDay = (item.birthday && item.birthday.day) || item.day || 1;
    bMonth = (item.birthday && item.birthday.month) || item.month || 1;
  }

  return {
    id: item.id || `bday_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: item.name.trim(),
    gender: item.gender || 'unspecified',
    relation: item.relation || '',
    customWish: item.customWish || '',
    birthday: {
      calendar: isHebrew ? 'hebrew' : 'gregorian',
      day: bDay,
      month: bMonth
    },
    createdAt: item.createdAt || new Date().toISOString()
  };
});

fs.writeFileSync(dataPath, JSON.stringify(migrated, null, 2), 'utf8');
console.log(`✅ Successfully migrated ${migrated.length} records in data/birthdays.json`);

const enriched = dateService.enrichAll(migrated);
console.log('\n--- Next 10 Birthdays in the Family ---');
enriched.slice(0, 10).forEach(p => {
  console.log(`${p.name} [${p.birthday.calendar === 'hebrew' ? 'עברי' : 'לועזי'}]: ${p.nextOccurrence.gregorianDisplay} • ${p.nextOccurrence.hebrewDisplay} (עוד ${p.nextOccurrence.daysRemaining} ימים)`);
});
