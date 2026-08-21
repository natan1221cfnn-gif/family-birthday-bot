const fs = require('fs');
const path = require('path');

async function syncAllToLive() {
  const authRes = await fetch('https://family-birthday-bot-obx1.onrender.com/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: 'natan1221' })
  });
  const auth = await authRes.json();

  const dataPath = path.join(__dirname, '..', 'data', 'birthdays.json');
  const birthdays = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const bdayRes = await fetch('https://family-birthday-bot-obx1.onrender.com/api/admin/set-birthdays', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + auth.token
    },
    body: JSON.stringify({ birthdays })
  });
  console.log('Birthdays Synced to Live:', await bdayRes.json());
}

syncAllToLive().catch(console.error);
