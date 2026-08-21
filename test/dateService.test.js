const assert = require('assert');
const dateService = require('../lib/dateService');
const { months, HDate, HebrewCalendar } = require('@hebcal/core');

console.log('🧪 Starting Date Service Comprehensive Test Suite...\n');

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASSED: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAILED: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Round-Trip Tests: Gregorian -> Hebrew -> Gregorian
test('Round-Trip: Gregorian -> Hebrew -> Gregorian across all months', () => {
  const testDates = [
    { year: 2026, month: 1, day: 15 },
    { year: 2026, month: 3, day: 25 },
    { year: 2026, month: 5, day: 10 },
    { year: 2026, month: 7, day: 7 },
    { year: 2026, month: 9, day: 15 },
    { year: 2026, month: 10, day: 19 },
    { year: 2026, month: 12, day: 31 }
  ];

  for (const d of testDates) {
    const heb = dateService.gregorianToHebrew(d.year, d.month, d.day);
    const backToGreg = dateService.hebrewToGregorian(heb.hebrewDay, heb.hebrewMonth, heb.hebrewYear);
    assert.strictEqual(backToGreg.day, d.day, `Day mismatch for ${JSON.stringify(d)}`);
    assert.strictEqual(backToGreg.month, d.month, `Month mismatch for ${JSON.stringify(d)}`);
    assert.strictEqual(backToGreg.year, d.year, `Year mismatch for ${JSON.stringify(d)}`);
  }
});

// 2. Round-Trip Tests: Hebrew -> Gregorian -> Hebrew
test('Round-Trip: Hebrew -> Gregorian -> Hebrew across all Hebrew months', () => {
  const hYear = 5787;
  const allMonths = [
    months.TISHREI, months.CHESHVAN, months.KISLEV, months.TEVET,
    months.SHVAT, months.ADAR_I, months.NISAN, months.IYYAR,
    months.SIVAN, months.TAMUZ, months.AV, months.ELUL
  ];

  for (const m of allMonths) {
    const day = 15;
    const greg = dateService.hebrewToGregorian(day, m, hYear);
    const backToHeb = dateService.gregorianToHebrew(greg.year, greg.month, greg.day);
    assert.strictEqual(backToHeb.hebrewDay, day, `Hebrew day mismatch for month ${m}`);
    assert.strictEqual(backToHeb.hebrewMonth, m, `Hebrew month mismatch for month ${m}`);
    assert.strictEqual(backToHeb.hebrewYear, hYear, `Hebrew year mismatch for month ${m}`);
  }
});

// 3. User's specific example: 19 October 2026
test('Specific Check: 19 October 2026 is 8 Cheshvan 5787 (NOT 24 Tishrei)', () => {
  const heb = dateService.gregorianToHebrew(2026, 10, 19);
  assert.strictEqual(heb.hebrewDay, 8);
  assert.strictEqual(heb.hebrewMonth, months.CHESHVAN);
  assert.strictEqual(heb.hebrewYear, 5787);
  console.log(`      19/10/2026 => ${heb.hebrewDisplay}`);
});

// 4. User's specific example: 24 Tishrei 5787
test('Specific Check: 24 Tishrei 5787 is 5 October 2026 (NOT 19 October)', () => {
  const greg = dateService.hebrewToGregorian(24, months.TISHREI, 5787);
  assert.strictEqual(greg.day, 5);
  assert.strictEqual(greg.month, 10);
  assert.strictEqual(greg.year, 2026);
  console.log(`      24 Tishrei 5787 => ${greg.gregorianDisplay}`);
});

// 5. Next Occurrence: Gregorian Birthday
test('Next Occurrence: Gregorian birthday future vs past in same year', () => {
  const mockToday = { year: 2026, month: 8, day: 21 }; // 21 Aug 2026

  // Birthday coming up on 19 October (future this year)
  const p1 = {
    name: 'פנינה תמרי',
    birthday: { calendar: 'gregorian', day: 19, month: 10 }
  };
  const occ1 = dateService.calculateNextOccurrence(p1, mockToday);
  assert.strictEqual(occ1.gregorianYear, 2026);
  assert.strictEqual(occ1.gregorianMonth, 10);
  assert.strictEqual(occ1.gregorianDay, 19);
  assert.strictEqual(occ1.daysRemaining, 59);
  assert.strictEqual(occ1.isToday, false);
  assert.strictEqual(occ1.hebrewDisplay, 'ח׳ בחשוון תשפ״ז');

  // Birthday that already passed on 10 July (rolls over to 2027)
  const p2 = {
    name: 'ציון כהן',
    birthday: { calendar: 'gregorian', day: 10, month: 7 }
  };
  const occ2 = dateService.calculateNextOccurrence(p2, mockToday);
  assert.strictEqual(occ2.gregorianYear, 2027);
  assert.strictEqual(occ2.gregorianMonth, 7);
  assert.strictEqual(occ2.gregorianDay, 10);
  assert.strictEqual(occ2.daysRemaining, 323);
  assert.strictEqual(occ2.isToday, false);
});

// 6. Next Occurrence: Hebrew Birthday
test('Next Occurrence: Hebrew birthday future vs past in same Hebrew year', () => {
  const mockToday = { year: 2026, month: 8, day: 21 }; // 21 Aug 2026 (7 Elul 5786)

  // 15 Elul 5786 (in 7 days from 8 Elul!)
  const p1 = {
    name: 'יוסי',
    birthday: { calendar: 'hebrew', day: 15, month: 'אלול' }
  };
  const occ1 = dateService.calculateNextOccurrence(p1, mockToday);
  assert.strictEqual(occ1.daysRemaining, 7);
  assert.strictEqual(occ1.hebrewYear, 5786);
  assert.strictEqual(occ1.gregorianDay, 28);
  assert.strictEqual(occ1.gregorianMonth, 8);
  assert.strictEqual(occ1.gregorianYear, 2026);

  // 15 Shevat (already passed in 5786 -> rolls over to 5787 / 23 Jan 2027)
  const p2 = {
    name: 'יעל',
    birthday: { calendar: 'hebrew', day: 15, month: 'שבט' }
  };
  const occ2 = dateService.calculateNextOccurrence(p2, mockToday);
  assert.strictEqual(occ2.hebrewYear, 5787);
  assert.strictEqual(occ2.gregorianYear, 2027);
  assert.strictEqual(occ2.gregorianMonth, 1);
  assert.strictEqual(occ2.gregorianDay, 23);
  assert.strictEqual(occ2.hebrewDisplay, 'ט״ו בשבט תשפ״ז');
  assert.strictEqual(occ2.gregorianDisplay, '23 בינואר 2027');
});

// 7. Today is Birthday Check
test('isToday flag is true on exact occurrence day', () => {
  const mockToday = { year: 2026, month: 10, day: 19 }; // 19 Oct 2026

  const pGreg = {
    name: 'חוגג לועזי',
    birthday: { calendar: 'gregorian', day: 19, month: 10 }
  };
  const occGreg = dateService.calculateNextOccurrence(pGreg, mockToday);
  assert.strictEqual(occGreg.daysRemaining, 0);
  assert.strictEqual(occGreg.isToday, true);

  // 8 Cheshvan 5787 falls on 19 Oct 2026
  const pHeb = {
    name: 'חוגגת עברי',
    birthday: { calendar: 'hebrew', day: 8, month: 'חשוון' }
  };
  const occHeb = dateService.calculateNextOccurrence(pHeb, mockToday);
  assert.strictEqual(occHeb.daysRemaining, 0);
  assert.strictEqual(occHeb.isToday, true);
});

// 8. Leap Year Adar Handling
test('Leap year Adar: Adar in leap year vs non-leap year', () => {
  // 5784 is a leap year (Embolismic), 5785 is regular
  assert.strictEqual(HDate.isLeapYear(5784), true);
  assert.strictEqual(HDate.isLeapYear(5785), false);

  // "אדר" in leap year defaults to Adar II
  const mLeap = dateService.normalizeHebrewMonth('אדר', true);
  assert.strictEqual(mLeap, months.ADAR_II);

  // "אדר" in regular year defaults to Adar (ADAR_I)
  const mRegular = dateService.normalizeHebrewMonth('אדר', false);
  assert.strictEqual(mRegular, months.ADAR_I);
});

// 9. Enrich Record: SSOT data structure
test('enrichPersonRecord creates unified backend payload', () => {
  const rawPerson = {
    id: 'b123',
    name: 'אלישע זגדון',
    birthday: { calendar: 'hebrew', day: 14, month: 'תשרי' },
    gender: 'male',
    relation: 'משפחה',
    customWish: 'שפע שמחה!'
  };

  const enriched = dateService.enrichPersonRecord(rawPerson);
  assert.strictEqual(enriched.id, 'b123');
  assert.strictEqual(enriched.name, 'אלישע זגדון');
  assert.ok(enriched.nextOccurrence);
  assert.ok(enriched.nextOccurrence.gregorianDisplay);
  assert.ok(enriched.nextOccurrence.hebrewDisplay);
  assert.ok(typeof enriched.nextOccurrence.daysRemaining === 'number');
  assert.ok(typeof enriched.nextOccurrence.isToday === 'boolean');
});

console.log(`\n🎉 ALL ${passedTests} TESTS PASSED SUCCESSFULLY!\n`);
