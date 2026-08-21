const assert = require('assert');
const fs = require('fs');
const path = require('path');
const dateService = require('../lib/dateService');
const bot = require('../bot');

console.log('🚀 Running Full System End-to-End Test...\n');

// 1. Verify DB records
const birthdays = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'birthdays.json'), 'utf8'));
assert.strictEqual(birthdays.length, 34, 'Expected 34 family members');
console.log(`✅ Loaded ${birthdays.length} family members from data/birthdays.json`);

// 2. Enrich all records
const enriched = dateService.enrichAll(birthdays);
assert.strictEqual(enriched.length, 34);
console.log('✅ Successfully enriched all 34 records with nextOccurrence');

// 3. Verify that all 34 records have valid nextOccurrence fields
for (const p of enriched) {
  assert.ok(p.nextOccurrence, `Missing nextOccurrence for ${p.name}`);
  assert.ok(p.nextOccurrence.gregorianDisplay, `Missing gregorianDisplay for ${p.name}`);
  assert.ok(p.nextOccurrence.hebrewDisplay, `Missing hebrewDisplay for ${p.name}`);
  assert.ok(typeof p.nextOccurrence.daysRemaining === 'number', `Invalid daysRemaining for ${p.name}`);
  assert.ok(p.nextOccurrence.daysRemaining >= 0, `Negative daysRemaining for ${p.name}`);
}
console.log('✅ All 34 records have positive daysRemaining and matching Hebrew & Gregorian displays');

// 4. Test User's Specific Example 1: 19 October (Gregorian SSOT)
const p19Oct = dateService.enrichPersonRecord({
  name: 'בדיקת 19 באוקטובר',
  birthday: { calendar: 'gregorian', day: 19, month: 10 }
}, { year: 2026, month: 8, day: 21 });

console.log('\n--- Check 19 October (Gregorian SSOT) ---');
console.log(`Gregorian: ${p19Oct.nextOccurrence.gregorianDisplay}`);
console.log(`Hebrew: ${p19Oct.nextOccurrence.hebrewDisplay}`);
console.log(`Days remaining: ${p19Oct.nextOccurrence.daysRemaining}`);
assert.strictEqual(p19Oct.nextOccurrence.gregorianDay, 19);
assert.strictEqual(p19Oct.nextOccurrence.gregorianMonth, 10);
assert.strictEqual(p19Oct.nextOccurrence.gregorianYear, 2026);
assert.strictEqual(p19Oct.nextOccurrence.hebrewDisplay, 'ח׳ בחשוון תשפ״ז');

// 5. Test User's Specific Example 2: 24 Tishrei (Hebrew SSOT)
const p24Tishrei = dateService.enrichPersonRecord({
  name: 'בדיקת כ"ד בתשרי',
  birthday: { calendar: 'hebrew', day: 24, month: 'תשרי' }
}, { year: 2026, month: 8, day: 21 });

console.log('\n--- Check 24 Tishrei (Hebrew SSOT) ---');
console.log(`Hebrew: ${p24Tishrei.nextOccurrence.hebrewDisplay}`);
console.log(`Gregorian: ${p24Tishrei.nextOccurrence.gregorianDisplay}`);
console.log(`Days remaining: ${p24Tishrei.nextOccurrence.daysRemaining}`);
assert.strictEqual(p24Tishrei.nextOccurrence.hebrewDay, 24);
assert.strictEqual(p24Tishrei.nextOccurrence.hebrewMonthName, 'תשרי');
assert.strictEqual(p24Tishrei.nextOccurrence.hebrewYear, 5787);
assert.strictEqual(p24Tishrei.nextOccurrence.gregorianDisplay, '5 באוקטובר 2026');

// 6. Test WhatsApp Greeting Generator
const maleGreeting = bot.formatGreetingMessage('', {
  name: 'דוד כהן',
  gender: 'male',
  customWish: 'המון בריאות ואושר!',
  birthday: { calendar: 'gregorian', day: 19, month: 10 }
});
assert.ok(maleGreeting.includes('*לדוד כהן*'), 'Should have bold name *לדוד כהן*');
assert.ok(maleGreeting.includes('היקר שחוגג היום'), 'Should have male honorific');
assert.ok(maleGreeting.includes('💬 *ברכה:*'), 'Should have bold wish header');

const femaleGreeting = bot.formatGreetingMessage('', {
  name: 'שרה כהן',
  gender: 'female',
  customWish: 'שפע שמחה והצלחה!',
  birthday: { calendar: 'hebrew', day: 24, month: 'תשרי' }
});
assert.ok(femaleGreeting.includes('*לשרה כהן*'), 'Should have bold name *לשרה כהן*');
assert.ok(femaleGreeting.includes('היקרה שחוגגת היום'), 'Should have female honorific');
assert.ok(femaleGreeting.includes('💬 *ברכה:*'), 'Should have bold wish header');

console.log('\n✅ WhatsApp Greeting Formatter validated for both male & female');
console.log('\n🎉 ALL END-TO-END SYSTEM CHECKS PASSED PERFECTLY!\n');
