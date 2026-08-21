const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'birthdays.json');
const list = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const cleaned = list.map(item => {
  return {
    ...item,
    id: item.id.replace(/['"״׳]/g, '').replace(/[^a-zA-Z0-9_\u0590-\u05FF]/g, '_')
  };
});

fs.writeFileSync(dataPath, JSON.stringify(cleaned, null, 2), 'utf8');
console.log('✅ Successfully sanitized all IDs in birthdays.json');
cleaned.forEach(c => console.log(`- ${c.name} -> ID: ${c.id}`));
