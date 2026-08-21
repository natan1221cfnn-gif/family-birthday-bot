const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'birthdays.json');
const list = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const cleaned = list.map(item => {
  const { year, hebrewYear, ...rest } = item;
  let cleanHebStr = rest.hebrewDateStr || '';
  // Strip year if present in hebrewDateStr (e.g. תשפ"ג or תשפ"ד)
  cleanHebStr = cleanHebStr.replace(/\s+(תש[א-ת"״׳]+|\d{4})$/g, '').trim();
  return {
    ...rest,
    hebrewDateStr: cleanHebStr
  };
});

fs.writeFileSync(dataPath, JSON.stringify(cleaned, null, 2), 'utf8');
console.log(`Cleaned ${cleaned.length} records in birthdays.json`);

async function syncLive() {
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
    body: JSON.stringify({ birthdays: cleaned })
  });
  const setResult = await setRes.json();
  console.log('Live Sync Result:', setResult);
}

syncLive().catch(console.error);
