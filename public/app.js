// Hebrew Month Names
const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

const HEBREW_NUMERALS = [
  "א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ז'", "ח'", "ט'", "י'",
  "י\"א", "י\"ב", "י\"ג", "י\"ד", "ט\"ו", "ט\"ז", "י\"ז", "י\"ח", "י\"ט", "כ'",
  "כ\"א", "כ\"ב", "כ\"ג", "כ\"ד", "כ\"ה", "כ\"ו", "כ\"ז", "כ\"ח", "כ\"ט", "ל'"
];

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
const monthFilter = document.getElementById('monthFilter');
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
    
    // Switch reminder radio to Hebrew by default
    const hebRadio = document.querySelector('input[name="reminderType"][value="hebrew"]');
    if (hebRadio) hebRadio.checked = true;
  } else {
    tabGreg.classList.add('active');
    tabHeb.classList.remove('active');
    gregWrap.style.display = 'grid';
    hebWrap.style.display = 'none';

    // Switch reminder radio to Gregorian by default
    const gregRadio = document.querySelector('input[name="reminderType"][value="gregorian"]');
    if (gregRadio) gregRadio.checked = true;
  }
};

// Setup Event Listeners
function setupEventListeners() {
  birthdayForm.addEventListener('submit', handleFormSubmit);
  searchInput.addEventListener('input', renderBirthdays);
  monthFilter.addEventListener('change', renderBirthdays);

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

        // Store token in session storage and redirect
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

// Handle Form Submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('personName').value.trim();
  const genderRadio = document.querySelector('input[name="gender"]:checked');
  const gender = genderRadio ? genderRadio.value : 'unspecified';

  const reminderRadio = document.querySelector('input[name="reminderType"]:checked');
  const reminderType = reminderRadio ? reminderRadio.value : 'gregorian';

  const dayVal = document.getElementById('birthDay').value;
  const monthVal = document.getElementById('birthMonth').value;
  const yearVal = document.getElementById('birthYear').value.trim();

  const hebrewDayVal = document.getElementById('hebrewDay').value;
  const hebrewMonthVal = document.getElementById('hebrewMonth').value;
  const hebrewYearVal = document.getElementById('hebrewYear').value.trim();

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
    if (!yearVal) {
      showFeedback('שנת לידה הינה שדה חובה', 'error');
      return;
    }
  }

  if (currentCalendarType === 'hebrew') {
    if (!hebrewDayVal || !hebrewMonthVal) {
      showFeedback('אנא בחרו יום וחודש עברי', 'error');
      return;
    }
    if (!hebrewYearVal) {
      showFeedback('שנת לידה עברית הינה שדה חובה (למשל: תשפ"ג או 2023)', 'error');
      return;
    }
  }

  // Set loading state
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline';
  submitBtn.disabled = true;

  try {
    const payload = {
      name,
      dateType: currentCalendarType,
      gender,
      reminderType,
      day: dayVal ? parseInt(dayVal, 10) : null,
      month: monthVal ? parseInt(monthVal, 10) : null,
      year: yearVal ? parseInt(yearVal, 10) : null,
      hebrewDay: hebrewDayVal ? parseInt(hebrewDayVal, 10) : null,
      hebrewMonth: hebrewMonthVal || null,
      hebrewYear: hebrewYearVal || null,
      relation,
      customWish
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

    // Success confetti animation
    triggerConfetti();

    showFeedback('איזה יופי! נוספת ללוח ימי ההולדת המשפחתי 🎉', 'success');
    birthdayForm.reset();

    // Reload and refresh
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

// Calculate Days until next birthday & Age
function getBirthdayCalculations(item) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // Create Date object for this year's birthday
  let bdayThisYear = new Date(currentYear, item.month - 1, item.day);
  let today = new Date(currentYear, currentMonth - 1, currentDay);

  let isToday = (item.month === currentMonth && item.day === currentDay);
  
  let targetYear = currentYear;
  if (bdayThisYear < today && !isToday) {
    targetYear = currentYear + 1;
  }

  let nextBday = new Date(targetYear, item.month - 1, item.day);
  const diffTime = nextBday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let age = null;
  if (item.year) {
    age = targetYear - item.year;
  }

  let genderAgeLabel = '';
  if (age) {
    if (item.gender === 'female') {
      genderAgeLabel = isToday ? `בת ${age}` : `תהיה בת ${age}`;
    } else if (item.gender === 'male') {
      genderAgeLabel = isToday ? `בן ${age}` : `יהיה בן ${age}`;
    } else {
      genderAgeLabel = isToday ? `גיל ${age}` : `יהיה גיל ${age}`;
    }
  }

  return {
    isToday,
    daysUntil: isToday ? 0 : diffDays,
    nextAge: age,
    genderAgeLabel,
    formattedDate: `${item.day} ב${HEBREW_MONTHS[item.month - 1]}`
  };
}

// Update the Top Highlight Card (Nearest or Today)
function updateHighlightCard() {
  if (!allBirthdays.length) {
    highlightName.textContent = 'עדיין אין ימי הולדת רשומים';
    highlightDesc.textContent = 'היו הראשונים להוסיף את יום ההולדת שלכם!';
    highlightDays.textContent = '--';
    highlightDaysText.textContent = '';
    return;
  }

  // Sort by days until
  const sorted = [...allBirthdays].map(item => ({
    ...item,
    calc: getBirthdayCalculations(item)
  })).sort((a, b) => a.calc.daysUntil - b.calc.daysUntil);

  const nearest = sorted[0];

  if (nearest.calc.isToday) {
    highlightLabel.textContent = 'חוגגים היום! 🎂';
    highlightName.textContent = nearest.name;
    const verb = nearest.gender === 'female' ? 'חוגגת' : (nearest.gender === 'male' ? 'חוגג' : 'חוגג/ת');
    highlightDesc.textContent = nearest.calc.genderAgeLabel 
      ? `${verb} היום יום הולדת (${nearest.calc.genderAgeLabel})! שיהיה המון מזל טוב! 🎉`
      : `${verb} היום יום הולדת! שיהיה המון מזל טוב! 🎉`;
    highlightDays.textContent = 'היום!';
    highlightDaysText.textContent = '🎈';
    highlightBadge.className = 'highlight-badge today';
  } else {
    highlightLabel.textContent = 'יום ההולדת הבא 🎈';
    highlightName.textContent = nearest.name;
    
    let ageStr = nearest.calc.genderAgeLabel ? `(${nearest.calc.genderAgeLabel})` : '';
    let hebrewDateExtra = nearest.hebrewDateStr ? ` • ${nearest.hebrewDateStr}` : '';
    highlightDesc.textContent = `ב-${nearest.calc.formattedDate}${hebrewDateExtra} ${ageStr}`;
    
    highlightDays.textContent = nearest.calc.daysUntil;
    highlightDaysText.textContent = nearest.calc.daysUntil === 1 ? 'מחר!' : 'ימים';
    highlightBadge.className = 'highlight-badge';
  }
}

// Render Birthday List based on Search & Filter
function renderBirthdays() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedMonth = monthFilter.value;

  let filtered = allBirthdays.filter(item => {
    const matchName = item.name.toLowerCase().includes(searchTerm) || 
                      (item.relation && item.relation.toLowerCase().includes(searchTerm)) ||
                      (item.hebrewDateStr && item.hebrewDateStr.includes(searchTerm));
    const matchMonth = (selectedMonth === 'all' || item.month.toString() === selectedMonth);
    return matchName && matchMonth;
  });

  // Sort by upcoming date
  filtered.sort((a, b) => {
    const calcA = getBirthdayCalculations(a);
    const calcB = getBirthdayCalculations(b);
    return calcA.daysUntil - calcB.daysUntil;
  });

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

  birthdaysList.innerHTML = filtered.map(item => {
    const calc = getBirthdayCalculations(item);
    const firstLetter = item.name.charAt(0);
    const genderIcon = item.gender === 'female' ? '👧' : (item.gender === 'male' ? '👦' : '👤');

    return `
      <div class="birthday-item ${calc.isToday ? 'is-today' : ''}">
        <div class="birthday-left">
          <div class="avatar-circle">${firstLetter}</div>
          <div class="item-info">
            <div class="item-name-row">
              <span class="item-name">${escapeHtml(item.name)}</span>
              ${item.relation ? `<span class="item-relation">${escapeHtml(item.relation)}</span>` : ''}
            </div>
            <div class="item-date">
              <span>📅 ${calc.formattedDate} ${item.year ? `(${item.year})` : ''}</span>
              ${item.hebrewDateStr ? `<span class="card-hebrew-date">• 📜 ${escapeHtml(item.hebrewDateStr)}</span>` : ''}
            </div>
            <div class="item-wish">${item.customWish ? `"${escapeHtml(item.customWish)}"` : '✨ "מאחלים שפע של בריאות, שמחה והגשמת חלומות!"'}</div>
            <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px; flex-wrap: wrap;">
              ${item.reminderType === 'hebrew' 
                ? '<span class="card-reminder-tag hebrew-pref">📜 תזכורת לפי עברי</span>' 
                : '<span class="card-reminder-tag">📅 תזכורת לפי לועזי</span>'}
              <a href="https://wa.me/972504225736?text=${encodeURIComponent(`היי, אני רוצה לעדכן את כרטיסיית יום ההולדת של ${item.name}`)}" target="_blank" class="card-wa-edit-btn" title="עדכן פרטים בוואטסאפ">
                💬 עדכן בוואטסאפ
              </a>
            </div>
          </div>
        </div>

        <div class="birthday-right">
          <span class="countdown-pill">
            ${calc.isToday ? '🎉 היום!' : (calc.daysUntil === 1 ? 'מחר!' : `עוד ${calc.daysUntil} ימים`)}
          </span>
          ${calc.genderAgeLabel ? `<span class="age-text">${calc.genderAgeLabel}</span>` : ''}
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
