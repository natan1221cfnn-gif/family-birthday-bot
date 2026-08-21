const fs = require('fs');
const path = require('path');

async function syncConfigLive() {
  const authRes = await fetch('https://family-birthday-bot-obx1.onrender.com/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: 'natan1221' })
  });
  const auth = await authRes.json();

  const configPath = path.join(__dirname, '..', 'data', 'config.json');
  const localConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const cfgRes = await fetch('https://family-birthday-bot-obx1.onrender.com/api/admin/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + auth.token
    },
    body: JSON.stringify(localConfig)
  });
  console.log('Live Config Updated:', await cfgRes.json());
}

syncConfigLive().catch(console.error);
