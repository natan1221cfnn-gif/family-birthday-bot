const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'data', 'birthdays.json');
const birthdays = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

async function inject() {
  console.log(`🚀 מזריק ${birthdays.length} ימי הולדת ישירות לשרת הענן...`);
  
  // 1. Authenticate
  const authRes = await fetch('https://family-birthday-bot-obx1.onrender.com/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: 'natan1221' })
  });
  
  if (!authRes.ok) throw new Error('שגיאת התחברות למנהל');
  const { token } = await authRes.json();
  console.log('🔑 התחבר בהצלחה למנהל.');

  // 2. Push all birthdays via POST /api/birthdays one by one or set-birthdays
  let successCount = 0;
  for (const b of birthdays) {
    const res = await fetch('https://family-birthday-bot-obx1.onrender.com/api/birthdays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: b.name,
        day: b.day,
        month: b.month,
        year: b.year,
        relation: b.relation,
        customWish: b.customWish || ''
      })
    });
    if (res.ok) {
      successCount++;
    } else {
      console.warn(`Failed for ${b.name}:`, await res.text());
    }
  }

  console.log(`\n🎉 הוזרקו בהצלחה ${successCount} מתוך ${birthdays.length} בני משפחה ישירות לשרת החי!`);
}

inject().catch(console.error);
