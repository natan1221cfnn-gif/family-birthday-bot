// Hebrew Month Names
const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

let allBirthdays = [];

// DOM Elements
const birthDaySelect = document.getElementById('birthDay');
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
  loadBirthdays();
  setupEventListeners();
});

// Populate Day Options (1 to 31)
function populateDayOptions() {
  for (let i = 1; i <= 31; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i;
    birthDaySelect.appendChild(opt);
  }
}

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
  const day = parseInt(document.getElementById('birthDay').value, 10);
  const month = parseInt(document.getElementById('birthMonth').value, 10);
  const yearVal = document.getElementById('birthYear').value.trim();
  const year = yearVal ? parseInt(yearVal, 10) : null;
  const relation = document.getElementById('personRelation').value.trim();
  const customWish = document.getElementById('customWish').value.trim();

  if (!name || isNaN(day) || isNaN(month)) {
    showFeedback('אנא מלאו את כל שדות החובה', 'error');
    return;
  }

  // Set loading state
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline';
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/birthdays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, day, month, year, relation, customWish })
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

  return {
    isToday,
    daysUntil: isToday ? 0 : diffDays,
    nextAge: age,
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
    highlightDesc.textContent = nearest.calc.nextAge 
      ? `חוגג/ת היום יום הולדת ${nearest.calc.nextAge}! שיהיה המון מזל טוב! 🎉`
      : `חוגג/ת היום יום הולדת! שיהיה המון מזל טוב! 🎉`;
    highlightDays.textContent = 'היום!';
    highlightDaysText.textContent = '🎈';
    highlightBadge.className = 'highlight-badge today';
  } else {
    highlightLabel.textContent = 'יום ההולדת הבא 🎈';
    highlightName.textContent = nearest.name;
    
    let ageStr = nearest.calc.nextAge ? `(יהיה בן/בת ${nearest.calc.nextAge})` : '';
    highlightDesc.textContent = `ב-${nearest.calc.formattedDate} ${ageStr}`;
    
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
                      (item.relation && item.relation.toLowerCase().includes(searchTerm));
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

    return `
      <div class="birthday-item ${calc.isToday ? 'is-today' : ''}">
        <div class="birthday-left">
          <div class="avatar-circle">${firstLetter}</div>
          <div class="item-info">
            <div class="item-name-row">
              <span class="item-name">${escapeHtml(item.name)}</span>
              ${item.relation ? `<span class="item-relation">${escapeHtml(item.relation)}</span>` : ''}
            </div>
            <div class="item-date">📅 ${calc.formattedDate} ${item.year ? `(${item.year})` : ''}</div>
            <div class="item-wish">${item.customWish ? `"${escapeHtml(item.customWish)}"` : '✨ "מאחלים שפע של בריאות, שמחה והגשמת חלומות!"'}</div>
          </div>
        </div>

        <div class="birthday-right">
          <span class="countdown-pill">
            ${calc.isToday ? '🎉 היום!' : (calc.daysUntil === 1 ? 'מחר!' : `עוד ${calc.daysUntil} ימים`)}
          </span>
          ${calc.nextAge ? `<span class="age-text">${calc.isToday ? 'גיל' : 'יהיה גיל'} ${calc.nextAge}</span>` : ''}
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
