const fs = require('fs');
const path = require('path');
const { convertGregorianToHebrew, convertHebrewToGregorian, normalizeHebrewMonth, parseHebrewYear } = require('../lib/hebrewCalendar');

async function fixAndSync() {
  const res = await fetch('https://family-birthday-bot-obx1.onrender.com/api/birthdays?t=' + Date.now());
  let liveList = await res.json();
  console.log(`Fetched ${liveList.length} items from live server.`);

  // Fix all items
  const fixedList = liveList.map(item => {
    let finalDay = item.day;
    let finalMonth = item.month;
    let finalYear = item.year;
    let finalHebDay = item.hebrewDay;
    let finalHebMonth = item.hebrewMonth ? normalizeHebrewMonth(item.hebrewMonth) : null;
    let finalHebYear = item.hebrewYear ? parseHebrewYear(item.hebrewYear) : null;

    // Special fix for Yonatan Beda who was born on 8 Kislev
    if (item.name.includes('יונתן בידה')) {
      finalHebDay = 8;
      finalHebMonth = 'כסלו';
      // If no year specified, let's set Hebrew year or calculate
      if (!finalHebYear && !finalYear) {
        finalHebYear = 5783; // 2022
        finalYear = 2022;
      }
      const greg = convertHebrewToGregorian(finalHebDay, finalHebMonth, finalHebYear);
      finalDay = greg.day;
      finalMonth = greg.month;
      finalYear = greg.year;
    }

    // Special fix for Shani Beda
    if (item.name.includes('שני בידה')) {
      finalHebMonth = 'תשרי';
      if (!finalHebYear && !finalYear) {
        finalHebYear = 5784;
        finalYear = 2023;
      }
      const greg = convertHebrewToGregorian(finalHebDay || 17, finalHebMonth, finalHebYear);
      finalDay = greg.day;
      finalMonth = greg.month;
      finalYear = greg.year;
    }

    // Recalculate Hebrew String
    let hebInfo = {};
    if (finalDay && finalMonth) {
      hebInfo = convertGregorianToHebrew(finalDay, finalMonth, finalYear);
    }

    return {
      ...item,
      day: finalDay,
      month: finalMonth,
      year: finalYear,
      hebrewDay: hebInfo.hebrewDay || finalHebDay,
      hebrewMonth: hebInfo.hebrewMonth || finalHebMonth,
      hebrewDateStr: hebInfo.hebrewDateStr || '',
      hebrewYear: hebInfo.hebrewYear || finalHebYear,
      reminderType: item.reminderType || 'hebrew'
    };
  });

  // Save to local data/birthdays.json
  const dataFile = path.join(__dirname, '..', 'data', 'birthdays.json');
  fs.writeFileSync(dataFile, JSON.stringify(fixedList, null, 2), 'utf8');
  console.log(`Saved ${fixedList.length} fixed items to data/birthdays.json`);

  // Authenticate and sync back to live server
  const authRes = await fetch('https://family-birthday-bot-obx1.onrender.com/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: 'natan1221' })
  });
  const authData = await authRes.json();

  const setRes = await fetch('https://family-birthday-bot-obx1.onrender.com/api/admin/set-birthdays', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authData.token
    },
    body: JSON.stringify({ birthdays: fixedList })
  });
  const setResult = await setRes.json();
  console.log('Sync to Live Result:', setResult);

  const yonatan = fixedList.find(x => x.name.includes('יונתן בידה'));
  console.log('Yonatan Beda record after fix:', yonatan);
}

fixAndSync().catch(console.error);
