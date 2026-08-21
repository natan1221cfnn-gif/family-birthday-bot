// Hebrew & Gregorian Month Names
const HEBREW_NUMERALS = [
  "א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ז'", "ח'", "ט'", "י'",
  "י\"א", "י\"ב", "י\"ג", "י\"ד", "ט\"ו", "ט\"ז", "י\"ז", "י\"ח", "י\"ט", "כ'",
  "כ\"א", "כ\"ב", "כ\"ג", "כ\"ד", "כ\"ה", "כ\"ו", "כ\"ז", "כ\"ח", "כ\"ט", "ל'"
];

const GREG_MONTHS = [
  "", "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
];

// Fallback Jewish Calendar Calculation
function isHebrewLeapYear(year) {
  return ((7 * year + 1) % 19) < 7;
}

function hebrewRoshHashanaJdn(year) {
  const monthsElapsed = Math.floor((235 * year - 234) / 19);
  const partsElapsed = 31524 + 765433 * monthsElapsed;
  let day = Math.floor(partsElapsed / 25920);
  const parts = partsElapsed % 25920;

  if (parts >= 19440) day += 1;
  let dow = day % 7;
  if (dow === 0 || dow === 3 || dow === 5) {
    day += 1;
  } else if (dow === 2 && parts >= 9924 && !isHebrewLeapYear(year)) {
    day += 2;
  } else if (dow === 1 && parts >= 16789 && isHebrewLeapYear(year - 1)) {
    day += 1;
  }
  return day + 347997;
}

function getDaysInHebrewYear(year) {
  return hebrewRoshHashanaJdn(year + 1) - hebrewRoshHashanaJdn(year);
}

function getDaysInHebrewMonth(year, monthIndex) {
  const isLeap = isHebrewLeapYear(year);
  const yearLength = getDaysInHebrewYear(year);

  if (monthIndex === 0) return 30; // Tishrei
  if (monthIndex === 1) return (yearLength === 355 || yearLength === 385) ? 30 : 29; // Cheshvan
  if (monthIndex === 2) return (yearLength === 353 || yearLength === 383) ? 29 : 30; // Kislev
  if (monthIndex === 3) return 29; // Tevet
  if (monthIndex === 4) return 30; // Shvat

  if (isLeap) {
    if (monthIndex === 5) return 30; // Adar I
    if (monthIndex === 6) return 29; // Adar II
    if (monthIndex === 7) return 30; // Nisan
    if (monthIndex === 8) return 29; // Iyyar
    if (monthIndex === 9) return 30; // Sivan
    if (monthIndex === 10) return 29; // Tamuz
    if (monthIndex === 11) return 30; // Av
    if (monthIndex === 12) return 29; // Elul
  } else {
    if (monthIndex === 5) return 29; // Adar
    if (monthIndex === 6) return 30; // Nisan
    if (monthIndex === 7) return 29; // Iyyar
    if (monthIndex === 8) return 30; // Sivan
    if (monthIndex === 9) return 29; // Tamuz
    if (monthIndex === 10) return 30; // Av
    if (monthIndex === 11) return 29; // Elul
  }
  return 29;
}

function julianToGregorian(jdn) {
  let a = jdn + 32044;
  let b = Math.floor((4 * a + 3) / 146097);
  let c = a - Math.floor((146097 * b) / 4);
  let d = Math.floor((4 * c + 3) / 1461);
  let e = c - Math.floor((1461 * d) / 4);
  let m = Math.floor((5 * e + 2) / 153);

  let day = e - Math.floor((153 * m + 2) / 5) + 1;
  let month = m + 3 - 12 * Math.floor(m / 10);
  let year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { day, month, year };
}

function normalizeHebrewMonthClient(str) {
  if (!str) return 'תשרי';
  const clean = str.toString().trim().replace(/['"״׳\s]/g, '').toLowerCase();
  const map = {
    'tishrei': 'תשרי', 'תשרי': 'תשרי',
    'cheshvan': 'חשוון', 'חשוון': 'חשוון', 'חשון': 'חשוון', 'מרחשוון': 'חשוון', 'מרחשון': 'חשוון',
    'kislev': 'כסלו', 'כסלו': 'כסלו', 'כסליו': 'כסלו',
    'tevet': 'טבת', 'טבת': 'טבת',
    'shvat': 'שבט', 'shevat': 'שבט', 'שבט': 'שבט',
    'adar': 'אדר', 'אדר': 'אדר', 'אדרא': "אדר א'", 'אדרב': "אדר ב'",
    'nisan': 'ניסן', 'ניסן': 'ניסן',
    'iyyar': 'אייר', 'אייר': 'אייר', 'איר': 'אייר',
    'sivan': 'סיוון', 'סיוון': 'סיוון', 'סיון': 'סיוון',
    'tamuz': 'תמוז', 'tammuz': 'תמוז', 'תמוז': 'תמוז',
    'av': 'אב', 'אב': 'אב', 'מנחםאב': 'אב',
    'elul': 'אלול', 'אלול': 'אלול'
  };
  return map[clean] || 'תשרי';
}

function clientHebrewToGregorian(hebrewDay, hebrewMonthInput, hebrewYearInput) {
  const normMonth = normalizeHebrewMonthClient(hebrewMonthInput);
  const hYear = parseInt(hebrewYearInput, 10) || 5787;
  const hDay = parseInt(hebrewDay, 10) || 1;

  const isLeap = isHebrewLeapYear(hYear);
  const monthNames = isLeap
    ? ["תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר א'", "אדר ב'", "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"]
    : ["תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר", "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"];

  let mIndex = monthNames.indexOf(normMonth);
  if (mIndex === -1) {
    mIndex = isLeap ? 6 : 5;
  }

  let jdn = hebrewRoshHashanaJdn(hYear);
  for (let i = 0; i < mIndex; i++) {
    jdn += getDaysInHebrewMonth(hYear, i);
  }
  jdn += (hDay - 1);
  return julianToGregorian(jdn);
}

// Bulletproof helper to extract nextOccurrence with 100% guarantee against undefined/NaN
function getSafeOccurrence(item) {
  if (item && item.nextOccurrence && item.nextOccurrence.gregorianShortDisplay && typeof item.nextOccurrence.daysRemaining === 'number') {
    return item.nextOccurrence;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const todayUtc = Date.UTC(currentYear, currentMonth - 1, currentDay, 12, 0, 0);

  const isHeb = (item.birthday && item.birthday.calendar === 'hebrew') || item.reminderType === 'hebrew' || item.dateType === 'hebrew';

  if (isHeb) {
    const hDay = (item.birthday && item.birthday.day) || item.hebrewDay || 1;
    const hMonth = (item.birthday && item.birthday.month) || item.hebrewMonth || 'תשרי';
    const hNum = HEBREW_NUMERALS[hDay - 1] || `${hDay}`;
    const hebrewDisplay = `${hNum} ב${hMonth}`;

    let hYear = 5786;
    let greg = clientHebrewToGregorian(hDay, hMonth, hYear);
    let targetUtc = Date.UTC(greg.year, greg.month - 1, greg.day, 12, 0, 0);
    let diffDays = Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      hYear = 5787;
      greg = clientHebrewToGregorian(hDay, hMonth, hYear);
      targetUtc = Date.UTC(greg.year, greg.month - 1, greg.day, 12, 0, 0);
      diffDays = Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
    }

    const mName = GREG_MONTHS[greg.month] || '';
    const gregShort = `${greg.day} ב${mName}`;
    const gregFull = `${greg.day} ב${mName} ${greg.year}`;

    return {
      gregorianShortDisplay: gregShort,
      gregorianDisplay: gregFull,
      gregorianMonth: greg.month,
      hebrewShortDisplay: hebrewDisplay,
      hebrewDisplay: `${hebrewDisplay} ${hYear}`,
      daysRemaining: Math.max(0, diffDays),
      isToday: diffDays === 0
    };
  } else {
    const day = (item.birthday && item.birthday.day) || item.day || 1;
    const month = (item.birthday && item.birthday.month) || item.month || 1;

    let targetYear = currentYear;
    let targetUtc = Date.UTC(targetYear, month - 1, day, 12, 0, 0);
    let diffDays = Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      targetYear = currentYear + 1;
      targetUtc = Date.UTC(targetYear, month - 1, day, 12, 0, 0);
      diffDays = Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
    }

    const mName = GREG_MONTHS[month] || '';
    const gregShort = `${day} ב${mName}`;
    const gregFull = `${day} ב${mName} ${targetYear}`;

    let cleanHeb = (item.hebrewDateStr || '').replace(/\s+תש[א-ת"״׳\']+/g, '').replace(/\s+ת\"[א-ת]/g, '').trim();
    if (!cleanHeb && item.hebrewDay && item.hebrewMonth) {
      const hNum = HEBREW_NUMERALS[item.hebrewDay - 1] || `${item.hebrewDay}`;
      cleanHeb = `${hNum} ב${item.hebrewMonth}`;
    }

    return {
      gregorianShortDisplay: gregShort,
      gregorianDisplay: gregFull,
      gregorianMonth: month,
      hebrewShortDisplay: cleanHeb,
      hebrewDisplay: cleanHeb,
      daysRemaining: Math.max(0, diffDays),
      isToday: diffDays === 0
    };
  }
}

let allBirthdays = [];
let currentCalendarType = 'gregorian';

// DOM Elements
const birthDaySelect = document.getElementById('birthDay');
const hebrewDaySelect = document.getElementById('hebrewDay');
const birthdayForm = document.getElementById('birthdayForm');
const submitBtn = document.getElementById('submitBtn');
const formFeedback = document.getElementById('formFeedback');
const birthdaysList = document.getElementById('birthdaysList');
const searchInput = document.getElementById('searchInput');
const monthFilterGregorian = document.getElementById('monthFilterGregorian');
const monthFilterHebrew = document.getElementById('monthFilterHebrew');
const totalCounter = document.getElementById('totalCounter');

// Highlight Card Elements
const highlightName = document.getElementById('highlightName');
const highlightDesc = document.getElementById('highlightDesc');
const highlightDays = document.getElementById('highlightDays');
const highlightDaysText = document.getElementById('highlightDaysText');
const highlightBadge = document.getElementById('highlightBadge');
const highlightLabel = document.getElementById('highlightLabel');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  populateDayOptions();
  populateHebrewDayOptions();
  loadBirthdays();
  setupEventListeners();
});

// Populate Gregorian Day Options (1 to 31)
function populateDayOptions() {
  if (!birthDaySelect) return;
  for (let i = 1; i <= 31; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i;
    birthDaySelect.appendChild(opt);
  }
}

// Populate Hebrew Day Options (א' to ל')
function populateHebrewDayOptions() {
  if (!hebrewDaySelect) return;
  HEBREW_NUMERALS.forEach((numeral, idx) => {
    const opt = document.createElement('option');
    opt.value = idx + 1;
    opt.textContent = `${numeral} (${idx + 1})`;
    hebrewDaySelect.appendChild(opt);
  });
}

// Switch between Gregorian & Hebrew Calendar Tabs
window.switchCalendarType = function(type) {
  currentCalendarType = type;
  const tabGreg = document.getElementById('tabGregorian');
  const tabHeb = document.getElementById('tabHebrew');
  const gregWrap = document.getElementById('gregorianDateWrap');
  const hebWrap = document.getElementById('hebrewDateWrap');

  if (type === 'hebrew') {
    tabHeb.classList.add('active');
    tabGreg.classList.remove('active');
    hebWrap.style.display = 'grid';
    gregWrap.style.display = 'none';
  } else {
    tabGreg.classList.add('active');
    tabHeb.classList.remove('active');
    gregWrap.style.display = 'grid';
    hebWrap.style.display = 'none';
  }
};

// Setup Event Listeners
function setupEventListeners() {
  birthdayForm.addEventListener('submit', handleFormSubmit);
  searchInput.addEventListener('input', renderBirthdays);
  
  if (monthFilterGregorian) {
    monthFilterGregorian.addEventListener('change', () => {
      if (monthFilterGregorian.value !== 'all' && monthFilterHebrew) {
        monthFilterHebrew.value = 'all';
      }
      renderBirthdays();
    });
  }

  if (monthFilterHebrew) {
    monthFilterHebrew.addEventListener('change', () => {
      if (monthFilterHebrew.value !== 'all' && monthFilterGregorian) {
        monthFilterGregorian.value = 'all';
      }
      renderBirthdays();
    });
  }

  // Admin Login Modal Events
  const openModalBtn = document.getElementById('openAdminModalBtn');
  const closeModalBtn = document.getElementById('closeAdminModalBtn');
  const adminModal = document.getElementById('adminModal');
  const modalAdminForm = document.getElementById('modalAdminForm');
  const modalAdminPin = document.getElementById('modalAdminPin');
  const modalAuthFeedback = document.getElementById('modalAuthFeedback');
  const modalSubmitBtn = document.getElementById('modalSubmitBtn');

  if (openModalBtn && adminModal) {
    openModalBtn.addEventListener('click', () => {
      adminModal.style.display = 'flex';
      modalAdminPin.value = '';
      modalAuthFeedback.style.display = 'none';
      setTimeout(() => modalAdminPin.focus(), 50);
    });

    closeModalBtn.addEventListener('click', () => {
      adminModal.style.display = 'none';
    });

    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) {
        adminModal.style.display = 'none';
      }
    });

    modalAdminForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = modalAdminPin.value.trim();
      if (!pin) return;

      const btnText = modalSubmitBtn.querySelector('.btn-text');
      const btnLoader = modalSubmitBtn.querySelector('.btn-loader');
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline';
      modalSubmitBtn.disabled = true;

      try {
        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'סיסמה שגויה');

        sessionStorage.setItem('admin_token', data.token);
        modalAuthFeedback.textContent = 'סיסמה נכונה! מעביר לפאנל הניהול... 🚀';
        modalAuthFeedback.className = 'form-feedback success';
        modalAuthFeedback.style.display = 'block';

        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 400);

      } catch (err) {
        modalAuthFeedback.textContent = err.message || 'סיסמה שגויה, נסו שוב';
        modalAuthFeedback.className = 'form-feedback error';
        modalAuthFeedback.style.display = 'block';
      } finally {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        modalSubmitBtn.disabled = false;
      }
    });
  }
}

// Fetch Birthdays from Backend
async function loadBirthdays() {
  try {
    const res = await fetch(`/api/birthdays?t=${Date.now()}`);
    if (!res.ok) throw new Error('שגיאה בטעינת הנתונים');
    allBirthdays = await res.json();
    renderBirthdays();
    updateHighlightCard();
  } catch (err) {
    console.error(err);
    birthdaysList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>לא הצלחנו לטעון את הרשימה כרגע. אנא נסו שוב מאוחר יותר.</p>
      </div>
    `;
  }
}

// Helper to normalize Hebrew strings for duplicate checks
function normalizeName(str) {
  return (str || '')
    .replace(/[\'\"\״\׳\`\־\-\.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function findDuplicatePerson(inputName, inputGender, inputCal, inputDay, inputMonth) {
  const normInput = normalizeName(inputName);
  if (!normInput || !allBirthdays || allBirthdays.length === 0) return null;

  return allBirthdays.find(p => {
    const normPName = normalizeName(p.name);
    const sameGender = p.gender && inputGender && (p.gender === inputGender || p.gender === 'unspecified' || inputGender === 'unspecified');
    
    // Check Date equality
    const pBday = p.birthday || {};
    let sameDate = false;
    if (inputCal === 'gregorian') {
      const pDay = parseInt(pBday.day || p.day, 10);
      const pMonth = parseInt(pBday.month || p.month, 10);
      if (pDay === parseInt(inputDay, 10) && pMonth === parseInt(inputMonth, 10)) {
        sameDate = true;
      }
    } else if (inputCal === 'hebrew') {
      const pDay = parseInt(pBday.day || p.hebrewDay, 10);
      const pMonth = (pBday.month || p.hebrewMonth || '').toString().trim();
      if (pDay === parseInt(inputDay, 10) && normalizeName(pMonth) === normalizeName(inputMonth)) {
        sameDate = true;
      }
    }

    // 1. Exact name match (even if date is different)
    if (normPName === normInput) {
      return true;
    }

    // 2. Contained name (e.g. "אלישע" in "אלישע זגדון") + (same date OR same gender)
    if (normPName.includes(normInput) || normInput.includes(normPName)) {
      if (sameDate || sameGender) {
        return true;
      }
    }

    // 3. Same first name + exact same date
    if (sameDate && (normPName.split(' ')[0] === normInput.split(' ')[0])) {
      return true;
    }

    return false;
  });
}

// Handle Form Submission
async function handleFormSubmit(e, force = false) {
  if (e && e.preventDefault) e.preventDefault();
  
  const name = document.getElementById('personName').value.trim();
  const genderRadio = document.querySelector('input[name="gender"]:checked');
  const gender = genderRadio ? genderRadio.value : 'unspecified';

  const dayVal = document.getElementById('birthDay') ? document.getElementById('birthDay').value : '';
  const monthVal = document.getElementById('birthMonth') ? document.getElementById('birthMonth').value : '';

  const hebrewDayVal = document.getElementById('hebrewDay') ? document.getElementById('hebrewDay').value : '';
  const hebrewMonthVal = document.getElementById('hebrewMonth') ? document.getElementById('hebrewMonth').value : '';

  const relation = document.getElementById('personRelation').value.trim();
  const customWish = document.getElementById('customWish').value.trim();

  if (!name) {
    showFeedback('אנא הזינו שם מלא', 'error');
    return;
  }

  if (currentCalendarType === 'gregorian') {
    if (!dayVal || !monthVal) {
      showFeedback('אנא בחרו יום וחודש לועזי', 'error');
      return;
    }
  }

  if (currentCalendarType === 'hebrew') {
    if (!hebrewDayVal || !hebrewMonthVal) {
      showFeedback('אנא בחרו יום וחודש עברי', 'error');
      return;
    }
  }

  // Duplicate Check (Name, Gender, Date)
  if (!force) {
    const isHeb = currentCalendarType === 'hebrew';
    const chosenDay = isHeb ? hebrewDayVal : dayVal;
    const chosenMonth = isHeb ? hebrewMonthVal : monthVal;
    
    const existing = findDuplicatePerson(name, gender, currentCalendarType, chosenDay, chosenMonth);
    if (existing) {
      const existingOcc = getSafeOccurrence(existing);
      const duplicateModal = document.getElementById('duplicateModal');
      const duplicateFoundBox = document.getElementById('duplicateFoundBox');
      const btnCancel = document.getElementById('btnCancelDuplicate');
      const btnConfirm = document.getElementById('btnConfirmDuplicate');
      
      if (duplicateModal && duplicateFoundBox) {
        const firstLetter = existing.name.charAt(0);
        const genderLabel = existing.gender === 'female' ? '👧 נקבה' : (existing.gender === 'male' ? '👦 זכר' : '');
        duplicateFoundBox.innerHTML = `
          <div class="duplicate-person-header">
            <div class="duplicate-avatar">${firstLetter}</div>
            <div>
              <div class="duplicate-name">${escapeHtml(existing.name)} ${genderLabel ? `<span style="font-size: 0.85rem; font-weight: normal; color: #78350F;">(${genderLabel})</span>` : ''}</div>
              <div style="font-size: 0.88rem; color: #78350F; font-weight: 500;">${existing.relation ? escapeHtml(existing.relation) : 'חבר/ת משפחה'}</div>
            </div>
          </div>
          <div class="duplicate-details">
            📅 <strong>תאריך לועזי:</strong> ${existingOcc.gregorianDisplay}<br>
            📜 <strong>תאריך עברי:</strong> ${existingOcc.hebrewDisplay}<br>
            🔔 <strong>סוג תזכורת:</strong> ${(existing.birthday?.calendar === 'hebrew' || existing.reminderType === 'hebrew') ? 'לפי תאריך עברי' : 'לפי תאריך לועזי'}
          </div>
        `;
        
        duplicateModal.style.display = 'flex';
        
        btnCancel.onclick = () => {
          duplicateModal.style.display = 'none';
        };
        
        btnConfirm.onclick = async () => {
          duplicateModal.style.display = 'none';
          await handleFormSubmit(null, true);
        };

        duplicateModal.onclick = (event) => {
          if (event.target === duplicateModal) {
            duplicateModal.style.display = 'none';
          }
        };
        
        return;
      }
    }
  }

  // Set loading state
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline';
  submitBtn.disabled = true;

  try {
    const isHeb = currentCalendarType === 'hebrew';
    const payload = {
      name,
      gender,
      relation,
      customWish,
      birthday: {
        calendar: currentCalendarType,
        day: isHeb ? parseInt(hebrewDayVal, 10) : parseInt(dayVal, 10),
        month: isHeb ? hebrewMonthVal : parseInt(monthVal, 10)
      }
    };

    const res = await fetch('/api/birthdays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'שגיאה בשמירת התאריך');
    }

    triggerConfetti();
    showFeedback('איזה יופי! נוספת ללוח ימי ההולדת המשפחתי 🎉', 'success');
    birthdayForm.reset();
    
    // Close form if it's open (after a short delay for feedback)
    setTimeout(() => {
      const wrapper = document.getElementById('formWrapper');
      if (wrapper && wrapper.classList.contains('open')) {
        toggleBirthdayForm();
      }
    }, 2500);

    await loadBirthdays();

  } catch (err) {
    showFeedback(err.message || 'אירעה שגיאה. נסו שוב.', 'error');
  } finally {
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
    submitBtn.disabled = false;
  }
}

// Show Form Feedback Message
function showFeedback(msg, type) {
  formFeedback.textContent = msg;
  formFeedback.className = `form-feedback ${type}`;
  formFeedback.style.display = 'block';
  setTimeout(() => {
    formFeedback.style.display = 'none';
  }, 5000);
}

// Update the Top Highlight Card (Nearest or Today)
let celebrationTriggered = false;

function triggerGrandBirthdayCelebration() {
  if (celebrationTriggered) return;
  celebrationTriggered = true;

  // 1. Double Confetti Cannons from sides
  if (typeof confetti === 'function') {
    const end = Date.now() + 2500;
    const colors = ['#D87053', '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#FFE5D9'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }

  // 2. Floating Balloons Animation
  createFloatingBalloons();
}

function createFloatingBalloons() {
  const existing = document.querySelector('.birthday-balloons-container');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.className = 'birthday-balloons-container';

  const balloonIcons = ['🎈', '🎂', '🎉', '🥳', '✨', '💖', '🎈', '🎈'];
  const count = 16;

  for (let i = 0; i < count; i++) {
    const b = document.createElement('div');
    b.className = 'floating-balloon';
    b.textContent = balloonIcons[Math.floor(Math.random() * balloonIcons.length)];
    b.style.left = `${Math.random() * 90 + 5}%`;
    b.style.animationDelay = `${Math.random() * 4}s`;
    b.style.animationDuration = `${6 + Math.random() * 5}s`;
    b.style.fontSize = `${2 + Math.random() * 1.2}rem`;
    container.appendChild(b);
  }

  document.body.appendChild(container);

  setTimeout(() => {
    if (container.parentNode) container.remove();
  }, 14000);
}

function updateHighlightCard() {
  if (!allBirthdays || !allBirthdays.length) {
    highlightName.textContent = 'עדיין אין ימי הולדת רשומים';
    highlightDesc.textContent = 'היו הראשונים להוסיף את יום ההולדת שלכם!';
    highlightDays.textContent = '--';
    highlightDaysText.textContent = '';
    return;
  }

  // Sort safely by days remaining
  const sorted = [...allBirthdays].map(item => ({
    item,
    occ: getSafeOccurrence(item)
  })).sort((a, b) => a.occ.daysRemaining - b.occ.daysRemaining);

  const nearest = sorted[0];
  const occ = nearest.occ;
  const person = nearest.item;
  const highlightCardEl = document.querySelector('.highlight-card');

  if (occ.isToday) {
    highlightLabel.textContent = 'חוגגים היום! 🎂';
    highlightName.textContent = person.name;
    const verb = person.gender === 'female' ? 'חוגגת' : (person.gender === 'male' ? 'חוגג' : 'חוגג/ת');
    highlightDesc.textContent = `${verb} היום יום הולדת! שיהיה המון מזל טוב! 🎉`;
    highlightDays.textContent = 'היום!';
    highlightDaysText.textContent = '🎈';
    highlightBadge.className = 'highlight-badge today';
    if (highlightCardEl) highlightCardEl.classList.add('celebration-glow');

    // Launch Birthday Mode Celebration!
    triggerGrandBirthdayCelebration();
  } else {
    highlightLabel.textContent = 'יום ההולדת הבא 🎈';
    highlightName.textContent = person.name;
    if (highlightCardEl) highlightCardEl.classList.remove('celebration-glow');
    
    let descText = `ב-📅 ${occ.gregorianShortDisplay}`;
    if (occ.hebrewShortDisplay) {
      descText += ` • 📜 ${occ.hebrewShortDisplay}`;
    }
    highlightDesc.textContent = descText;
    
    highlightDays.textContent = occ.daysRemaining;
    highlightDaysText.textContent = occ.daysRemaining === 1 ? 'מחר!' : 'ימים';
    highlightBadge.className = 'highlight-badge';
  }
}

// Render Birthday List based on Search & Filter
function renderBirthdays() {
  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const selectedGregMonth = monthFilterGregorian ? monthFilterGregorian.value : 'all';
  const selectedHebMonth = monthFilterHebrew ? monthFilterHebrew.value : 'all';

  const processed = allBirthdays.map(item => ({
    item,
    occ: getSafeOccurrence(item)
  }));

  let filtered = processed.filter(({ item, occ }) => {
    const matchName = !searchTerm ||
                      item.name.toLowerCase().includes(searchTerm) || 
                      (item.relation && item.relation.toLowerCase().includes(searchTerm)) ||
                      (occ.hebrewDisplay && occ.hebrewDisplay.includes(searchTerm)) ||
                      (occ.gregorianDisplay && occ.gregorianDisplay.includes(searchTerm));
                      
    let matchMonth = true;
    if (selectedGregMonth !== 'all') {
      matchMonth = (occ.gregorianMonth && occ.gregorianMonth.toString() === selectedGregMonth);
    } else if (selectedHebMonth !== 'all') {
      const hebStr = `${occ.hebrewDisplay || ''} ${occ.hebrewShortDisplay || ''} ${occ.hebrewMonthName || ''} ${item.birthday?.month || ''} ${item.hebrewMonth || ''}`;
      if (selectedHebMonth === 'אדר') {
        matchMonth = hebStr.includes('אדר');
      } else {
        matchMonth = hebStr.includes(selectedHebMonth);
      }
    }

    return matchName && matchMonth;
  });

  filtered.sort((a, b) => a.occ.daysRemaining - b.occ.daysRemaining);

  totalCounter.textContent = `${allBirthdays.length} רשומים`;

  if (filtered.length === 0) {
    birthdaysList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎈</div>
        <p>לא נמצאו ימי הולדת לפי החיפוש.</p>
      </div>
    `;
    return;
  }

  birthdaysList.innerHTML = filtered.map(({ item, occ }) => {
    const firstLetter = item.name.charAt(0);
    const isHebrewPref = (item.birthday && item.birthday.calendar === 'hebrew') || item.reminderType === 'hebrew';

    return `
      <div class="birthday-item ${occ.isToday ? 'is-today' : ''}">
        <div class="birthday-left">
          <div class="avatar-circle">${firstLetter}</div>
          <div class="item-info">
            <div class="item-name-row">
              <span class="item-name">${escapeHtml(item.name)}</span>
              ${item.relation ? `<span class="item-relation">${escapeHtml(item.relation)}</span>` : ''}
            </div>
            <div class="item-date">
              <span>📅 ${occ.gregorianShortDisplay}</span>
              ${occ.hebrewShortDisplay ? `<span class="card-hebrew-date">• 📜 ${escapeHtml(occ.hebrewShortDisplay)}</span>` : ''}
            </div>
            <div class="item-wish">${item.customWish ? `"${escapeHtml(item.customWish)}"` : '✨ "מאחלים שפע של בריאות, שמחה והגשמת חלומות!"'}</div>
            <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px; flex-wrap: wrap;">
              ${isHebrewPref 
                ? '<span class="card-reminder-tag hebrew-pref">📜 תזכורת לפי עברי</span>' 
                : '<span class="card-reminder-tag">📅 תזכורת לפי לועזי</span>'}
              <a href="https://wa.me/972504225736?text=${encodeURIComponent(`היי, אני רוצה לעדכן את כרטיסיית יום ההולדת של ${item.name}`)}" target="_blank" class="card-wa-edit-btn" title="עדכן פרטים בוואטסאפ">
                💬 עדכן
              </a>
            </div>
          </div>
        </div>

        <div class="birthday-right">
          <span class="countdown-pill">
            ${occ.isToday ? '🎉 היום!' : (occ.daysRemaining === 1 ? 'מחר!' : `עוד ${occ.daysRemaining} ימים`)}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

// Quick Wish Setter helper
window.setWish = function(text) {
  const wishInput = document.getElementById('customWish');
  if (wishInput) {
    wishInput.value = text;
    wishInput.focus();
  }
};

// Confetti Effect Helper
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D87053', '#6B9080', '#E7A947', '#FFE5D9']
    });
  }
}

// Escape HTML for XSS safety
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
// Toggle Birthday Form
function toggleBirthdayForm() {
  const wrapper = document.getElementById('formWrapper');
  const icon = document.getElementById('formToggleIcon');
  const btn = document.getElementById('toggleFormBtn');
  if(!wrapper || !icon || !btn) return;
  const isOpen = wrapper.classList.toggle('open');
  icon.classList.toggle('open');
  btn.setAttribute('aria-expanded', isOpen);
}

// Toggle Memorial Story Drawer (Grandma Rachel z"l)
window.toggleMemorialStory = function() {
  const drawer = document.getElementById('memorialDrawer');
  const arrow = document.getElementById('memorialArrow');
  const btn = document.getElementById('memorialBannerBtn');
  if (!drawer || !arrow || !btn) return;
  
  const isOpen = drawer.classList.toggle('open');
  arrow.classList.toggle('open');
  btn.setAttribute('aria-expanded', isOpen);
};

