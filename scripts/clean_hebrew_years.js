const fs = require('fs');
const path = require('path');

async function cleanLiveAndLocal() {
  // 1. Local data/birthdays.json
  const dataPath = path.join(__dirname, '..', 'data', 'birthdays.json');
  const localList = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const cleanedLocal = localList.map(item => ({
    ...item,
    hebrewDateStr: (item.hebrewDateStr || '').replace(/\s+תש[א-ת"״׳']+/g, '').replace(/\s+ת"[א-ת]/g, '').trim()
  }));
  fs.writeFileSync(dataPath, JSON.stringify(cleanedLocal, null, 2), 'utf8');
  console.log('✅ Local data/birthdays.json cleaned of Hebrew year suffixes');

  // 2. Live Render
  const authRes = await fetch('https://family-birthday-bot-obx1.onrender.com/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: 'natan1221' })
  });
  const auth = await authRes.json();

  const listRes = await fetch('https://family-birthday-bot-obx1.onrender.com/api/birthdays');
  const list = await listRes.json();

  const cleanedLive = list.map(item => ({
    ...item,
    hebrewDateStr: (item.hebrewDateStr || '').replace(/\s+תש[א-ת"״׳']+/g, '').replace(/\s+ת"[א-ת]/g, '').trim()
  }));

  const saveRes = await fetch('https://family-birthday-bot-obx1.onrender.com/api/admin/set-birthdays', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + auth.token
    },
    body: JSON.stringify({ birthdays: cleanedLive })
  });
  console.log('✅ Live Render birthdays cleaned and saved:', await saveRes.json());
}

cleanLiveAndLocal().catch(console.error);
