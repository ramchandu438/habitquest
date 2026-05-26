/* HabitQuest User Interface and Controller Modules */

import { 
  getHabits, 
  getLogs, 
  getProfile, 
  saveHabits, 
  saveLogs,
  saveProfile, 
  addHabit, 
  deleteHabit, 
  updateHabit,
  toggleLog, 
  isCompleted, 
  calculateStreak, 
  formatDate,
  exportData,
  importData
} from './storage.js';

import { 
  awardXP, 
  checkAchievements, 
  ACHIEVEMENTS, 
  xpForNextLevel, 
  displayLevelUpOverlay,
  displayToastNotification,
  XP_PER_COMPLETION
} from './gamification.js';

import { 
  renderProgressRing, 
  renderHeatmap, 
  renderCategoryStats,
  renderProgressTrend
} from './charts.js';

// SVG Icons Registry for Categories
const CATEGORY_ICONS = {
  health: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
  mind: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>`,
  career: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path></svg>`,
  social: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  finance: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
  creative: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.34431 19.4857 5.75388 20.0655 6.07188 20.7015C6.27318 21.1041 6.68538 21.3592 7.13788 21.3592H12V22Z"></path><circle cx="7.5" cy="10.5" r="1.5"></circle><circle cx="11.5" cy="7.5" r="1.5"></circle><circle cx="16.5" cy="9.5" r="1.5"></circle><circle cx="15.5" cy="14.5" r="1.5"></circle></svg>`
};

const CATEGORY_COLORS = {
  health: 'var(--cat-health)',
  mind: 'var(--cat-mind)',
  career: 'var(--cat-career)',
  social: 'var(--cat-social)',
  finance: 'var(--cat-finance)',
  creative: 'var(--cat-creative)'
};

let currentFilter = 'all';
let lastRenderedDate = formatDate(new Date());

// Initialize UI layout
export function initUI() {
  setupEventListeners();
  renderAll();
  
  // Always force the dedicated Vintage Journal Diary theme
  document.documentElement.setAttribute('data-theme', 'vintage-journal');

  // Render current date and day display
  updateDateHeader();

  // Setup dynamic midnight rolling check
  setupMidnightCheck();
}

// Update date header dynamically
function updateDateHeader() {
  const dateDisplay = document.getElementById('current-date-display');
  if (dateDisplay) {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = today.toLocaleDateString('en-US', options);
  }
}

// Setup dynamic midnight rolling check on focus/visibility change
function setupMidnightCheck() {
  const checkTimeShift = () => {
    const todayStr = formatDate(new Date());
    if (todayStr !== lastRenderedDate) {
      console.log(`Midnight roll detected! Shifting from ${lastRenderedDate} to ${todayStr}`);
      lastRenderedDate = todayStr;
      updateDateHeader();
      renderAll();
    }
  };

  window.addEventListener('focus', checkTimeShift);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkTimeShift();
    }
  });

  // Periodic fallback check (every 30 seconds)
  setInterval(checkTimeShift, 30000);
}

// Global Re-render
export function renderAll() {
  renderProfile();
  renderHabitsList();
  renderTodayProgress();
  renderHeatmap('.heatmap-render-area');
  renderCategoryStats('.category-stats-render-area');
  renderProgressTrend('#progress-chart-render-area');
  renderAchievementsPanel();
  renderJournalTimeline();
  renderActivityLog();
}

// Render Level, XP and Top Bar Details
function renderProfile() {
  const profile = getProfile();
  const xpLimit = xpForNextLevel(profile.level);
  const pct = (profile.xp / xpLimit) * 100;

  // Update elements
  const levelNumEl = document.getElementById('user-level-number');
  const xpCurrentEl = document.getElementById('xp-current');
  const xpTargetEl = document.getElementById('xp-target');
  const xpFillEl = document.getElementById('xp-fill');

  if (levelNumEl) levelNumEl.textContent = profile.level;
  if (xpCurrentEl) xpCurrentEl.textContent = profile.xp;
  if (xpTargetEl) xpTargetEl.textContent = xpLimit;
  if (xpFillEl) xpFillEl.style.width = `${pct}%`;
}

// Render overall stats snapshot
function renderTodayProgress() {
  const habits = getHabits();
  if (habits.length === 0) {
    renderProgressRing('.circular-progress-wrap', 0);
    return;
  }

  const todayStr = formatDate(new Date());
  let completedCount = 0;

  for (const h of habits) {
    if (isCompleted(h.id, todayStr)) {
      completedCount++;
    }
  }

  const pct = (completedCount / habits.length) * 100;
  renderProgressRing('.circular-progress-wrap', pct);

  // Update status summary values
  const totalHabitsVal = document.getElementById('total-habits-val');
  const completedTodayVal = document.getElementById('completed-today-val');

  if (totalHabitsVal) totalHabitsVal.textContent = habits.length;
  if (completedTodayVal) completedTodayVal.textContent = completedCount;
}

// Render Habits Cards
function renderHabitsList() {
  const habitsGrid = document.getElementById('habits-grid');
  if (!habitsGrid) return;

  habitsGrid.innerHTML = '';
  const habits = getHabits();
  
  const filtered = currentFilter === 'all' 
    ? habits 
    : habits.filter(h => h.category === currentFilter);

  // Generate date checklist values for the rolling past 7 days (including today)
  const past7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    past7Days.push({
      dateStr: formatDate(d),
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'narrow' }), // Single letter label
      fullLabel: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    });
  }

  for (const habit of filtered) {
    const streak = calculateStreak(habit.id);
    const cardAccent = CATEGORY_COLORS[habit.category] || 'var(--accent)';
    const cardColorRGB = getComputedStyle(document.documentElement).getPropertyValue(`--cat-${habit.category}`).trim();

    const card = document.createElement('div');
    card.className = 'glass-panel habit-card';
    card.style.setProperty('--card-accent', cardAccent);
    card.style.setProperty('--cat-color', cardColorRGB || '255, 0, 127');

    // Checklist HTML
    let checklistHtml = `<div class="weekly-check-grid">`;
    for (const day of past7Days) {
      const checked = isCompleted(habit.id, day.dateStr);
      const isToday = day.dateStr === formatDate(new Date());

      // If frequency is set to specific days, make others look disabled
      let disabledClass = '';
      let isApplicable = true;
      if (habit.frequency.type === 'weekly_days') {
        const jsDay = new Date(day.dateStr).getDay(); // 0=Sun, 1=Mon...
        const adjustedDay = jsDay === 0 ? 7 : jsDay; // Map Sunday to 7
        if (!habit.frequency.days.includes(adjustedDay)) {
          disabledClass = 'disabled';
          isApplicable = false;
        }
      }

      checklistHtml += `
        <div class="day-check-col">
          <span class="day-label ${isToday ? 'tooltip' : ''}" ${isToday ? 'data-tooltip="Today"' : ''}>${day.dayLabel}</span>
          <label class="checkbox-container ${disabledClass} tooltip" data-tooltip="${isToday ? 'Log today' : day.fullLabel}">
            <input type="checkbox" 
                   data-habit-id="${habit.id}" 
                   data-date="${day.dateStr}"
                   ${checked ? 'checked' : ''}
                   ${!isApplicable ? 'disabled' : ''}>
            <span class="checkmark"></span>
          </label>
        </div>
      `;
    }
    checklistHtml += `</div>`;

    card.innerHTML = `
      <div class="habit-card-header">
        <div class="habit-meta">
          <div class="habit-icon-wrapper">
            ${CATEGORY_ICONS[habit.category] || CATEGORY_ICONS.health}
          </div>
          <div class="habit-details">
            <span class="habit-name">${habit.name}</span>
            <span class="habit-category-tag">${habit.category}</span>
          </div>
        </div>
        <div class="habit-card-actions">
          <button class="card-action-btn btn-note tooltip" data-tooltip="Add Today's Note" data-id="${habit.id}" data-name="${habit.name}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button class="card-action-btn btn-edit tooltip" data-tooltip="Edit Habit Settings" data-id="${habit.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
          <button class="card-action-btn btn-delete tooltip" data-tooltip="Delete Habit" data-id="${habit.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>

      <div class="habit-card-streaks">
        <div class="streak-counter">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"></path></svg>
          <span class="streak-label">Streak:</span>
          <span class="streak-val">${streak.current} days</span>
        </div>
        <div class="streak-counter">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span class="streak-label">Best:</span>
          <span class="streak-val">${streak.max} days</span>
        </div>
      </div>

      ${checklistHtml}
    `;

    // Add event listener for checkbox completion changes
    const checkboxes = card.querySelectorAll('.weekly-check-grid input[type="checkbox"]');
    checkboxes.forEach(chk => {
      chk.addEventListener('change', (e) => {
        handleLogChange(e.target);
      });
    });

    // Note button logic
    const noteBtn = card.querySelector('.btn-note');
    noteBtn.addEventListener('click', () => {
      openReflectionModal(habit.id, habit.name);
    });

    // Edit button logic
    const editBtn = card.querySelector('.btn-edit');
    editBtn.addEventListener('click', () => {
      openEditModal(habit.id);
    });

    // Delete button logic
    const delBtn = card.querySelector('.btn-delete');
    delBtn.addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
        deleteHabit(habit.id);
        renderAll();
      }
    });

    habitsGrid.appendChild(card);
  }
}

// Log completion checkbox change handler
function handleLogChange(checkboxEl) {
  const habitId = checkboxEl.getAttribute('data-habit-id');
  const dateStr = checkboxEl.getAttribute('data-date');
  const isChecked = checkboxEl.checked;

  // Execute storage log (Toggles completion directly, no blocking popups!)
  const logs = getLogs();
  const index = logs.findIndex(l => l.habitId === habitId && l.date === dateStr);
  const existedBefore = index > -1;

  toggleLog(habitId, dateStr, '');

  // Gamification rewards!
  if (isChecked && !existedBefore) {
    // Determine streak multiplier bonus
    const streak = calculateStreak(habitId);
    const bonusMultiplier = Math.min(5, Math.floor(streak.current / 3)); // +5 XP per 3 days of streak, max +25 XP
    const calculatedXP = XP_PER_COMPLETION + (bonusMultiplier * 5);

    // Award XP
    awardXP(calculatedXP, (newLevel) => {
      displayLevelUpOverlay(newLevel);
    });

    // Check achievement completions
    checkAchievements(
      (badgeAwarded) => {
        // High fidelity custom non-blocking notification toast
        displayToastNotification(
          'Achievement Unlocked!',
          `${badgeAwarded.title} (+${badgeAwarded.xp} XP)`,
          '🏆',
          badgeAwarded.color
        );
      },
      (newLevel) => {
        displayLevelUpOverlay(newLevel);
      }
    );
  }

  renderAll();
}

// Open custom Reflections Modal
function openReflectionModal(habitId, habitName) {
  const modal = document.getElementById('reflection-note-modal');
  const idInput = document.getElementById('note-habit-id');
  const dateInput = document.getElementById('note-date');
  const textInput = document.getElementById('note-text-input');
  const label = document.getElementById('note-modal-label');

  if (!modal || !idInput || !dateInput || !textInput) return;

  const todayStr = formatDate(new Date());

  idInput.value = habitId;
  dateInput.value = todayStr;
  
  // Fill existing note if any
  const logs = getLogs();
  const existingLog = logs.find(l => l.habitId === habitId && l.date === todayStr);
  textInput.value = existingLog ? (existingLog.note || '') : '';
  
  if (label) {
    label.textContent = `What are your thoughts on completing "${habitName}" today?`;
  }

  modal.classList.add('active');
}

// Open Edit Habit Modal & pre-fill values
let editModalSelectedCategory = 'health';
function openEditModal(habitId) {
  const modal = document.getElementById('edit-habit-modal');
  const habits = getHabits();
  const habit = habits.find(h => h.id === habitId);

  if (!modal || !habit) return;

  // Prefill hidden ID
  document.getElementById('edit-habit-id').value = habit.id;
  // Prefill Name
  document.getElementById('edit-habit-name-input').value = habit.name;
  
  // Prefill Category
  editModalSelectedCategory = habit.category;
  const catBtns = document.querySelectorAll('.edit-cat-picker-btn');
  catBtns.forEach(btn => {
    btn.classList.remove('selected');
    if (btn.getAttribute('data-category') === habit.category) {
      btn.classList.add('selected');
    }
  });

  // Prefill Frequency Type
  const freqTypeSelect = document.getElementById('edit-habit-freq-type');
  freqTypeSelect.value = habit.frequency.type;

  const specificDaysContainer = document.getElementById('edit-form-specific-days-wrap');
  const daySelectors = document.querySelectorAll('.edit-day-selector-btn');

  if (habit.frequency.type === 'weekly_days') {
    specificDaysContainer.style.display = 'flex';
    daySelectors.forEach(btn => {
      const dayNum = parseInt(btn.getAttribute('data-day'));
      if (habit.frequency.days && habit.frequency.days.includes(dayNum)) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  } else {
    specificDaysContainer.style.display = 'none';
    daySelectors.forEach(btn => btn.classList.add('selected'));
  }

  modal.classList.add('active');
}

// Render Achievements Panel
function renderAchievementsPanel() {
  const grid = document.getElementById('achievements-grid');
  if (!grid) return;

  grid.innerHTML = '';
  const profile = getProfile();

  for (const ach of ACHIEVEMENTS) {
    const unlocked = profile.achievements.includes(ach.id);
    const card = document.createElement('div');
    card.className = `badge-card ${unlocked ? 'unlocked' : ''}`;
    card.style.setProperty('--accent-secondary-color', ach.color);

    card.innerHTML = `
      <div class="badge-icon">
        ${ach.icon}
      </div>
      <div class="badge-title">${ach.title}</div>
      <div class="badge-desc">${ach.description}</div>
      <div class="badge-xp">+${ach.xp} XP</div>
    `;

    grid.appendChild(card);
  }
}

// Render Journal Timeline Reflections
function renderJournalTimeline() {
  const container = document.getElementById('journal-timeline');
  if (!container) return;

  container.innerHTML = '';
  const logs = getLogs().filter(l => l.note && l.note.trim() !== '');
  const habits = getHabits();

  // Sort logs chronologically descending
  const sortedNotes = logs.sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const log of sortedNotes) {
    const parentHabit = habits.find(h => h.id === log.habitId);
    const habitName = parentHabit ? parentHabit.name : 'Unknown Habit';
    const habitCat = parentHabit ? parentHabit.category : 'health';
    const catColor = CATEGORY_COLORS[habitCat] || 'var(--accent)';

    const card = document.createElement('div');
    card.className = 'glass-panel journal-card';

    const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    card.innerHTML = `
      <div class="journal-card-header">
        <span class="journal-date">${formattedDate}</span>
        <span class="journal-habit-pill" style="--cat-color: ${catColor}">${habitName}</span>
      </div>
      <div class="journal-note">"${log.note}"</div>
    `;

    container.appendChild(card);
  }
}

// Render Mini Activity Snapshot Widget
function renderActivityLog() {
  const container = document.getElementById('activity-snapshot');
  if (!container) return;

  container.innerHTML = '';
  const logs = getLogs();
  const habits = getHabits();

  // Take the last 5 logs chronologically descending
  const lastLogs = logs.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  if (lastLogs.length === 0) {
    container.innerHTML = `<div style="font-size:0.75rem; color: var(--text-muted); text-align:center;">No activity logged today yet. Check off a habit!</div>`;
    return;
  }

  for (const log of lastLogs) {
    const parentHabit = habits.find(h => h.id === log.habitId);
    const name = parentHabit ? parentHabit.name : 'Deleted Habit';
    const cat = parentHabit ? parentHabit.category : 'health';

    const item = document.createElement('div');
    item.className = 'activity-item';

    const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    item.innerHTML = `
      <div class="activity-icon" style="background: ${CATEGORY_COLORS[cat] || 'var(--accent)'}"></div>
      <div class="activity-desc">
        <span class="activity-text">Completed <strong>${name}</strong></span>
        <span class="activity-time">${formattedDate} ${log.note ? '📝 with note' : ''}</span>
      </div>
    `;

    container.appendChild(item);
  }
}

// Bind interactive event listeners for navigation and modals
function setupEventListeners() {
  // 1. Tab Links Switching
  const tabs = document.querySelectorAll('.tab-link');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetPanel = tab.getAttribute('data-target');
      const panels = document.querySelectorAll('.tab-panel');
      panels.forEach(p => p.classList.remove('active'));
      
      const targetEl = document.getElementById(targetPanel);
      if (targetEl) targetEl.classList.add('active');
    });
  });

  // 2. Category filters
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderHabitsList();
    });
  });

  // 3. (Theme selector removed - dedicated vintage dairy layout)

  // 4. Modal toggles (Add Habit Modal)
  const openModalBtn = document.getElementById('btn-open-add-modal');
  const closeModalBtn = document.getElementById('btn-close-modal');
  const addModal = document.getElementById('add-habit-modal');

  if (openModalBtn && addModal) {
    openModalBtn.addEventListener('click', () => {
      addModal.classList.add('active');
      // Reset form days selector styling
      const daySelectors = document.querySelectorAll('#add-habit-modal .day-selector-btn');
      daySelectors.forEach(btn => btn.classList.add('selected')); // Select all by default
    });
  }

  if (closeModalBtn && addModal) {
    closeModalBtn.addEventListener('click', () => {
      addModal.classList.remove('active');
    });
  }

  // Close modal when clicking on background overlay
  if (addModal) {
    addModal.addEventListener('click', (e) => {
      if (e.target === addModal) {
        addModal.classList.remove('active');
      }
    });
  }

  // 5. Add Habit Modal - Category selection picker
  const catPickerBtns = document.querySelectorAll('#add-habit-modal .category-picker-btn');
  let selectedCategory = 'health'; // Default selected

  catPickerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      catPickerBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedCategory = btn.getAttribute('data-category');
    });
  });

  // 6. Frequency Type toggles in form
  const freqTypeSelect = document.getElementById('habit-freq-type');
  const specificDaysContainer = document.getElementById('form-specific-days-wrap');
  
  if (freqTypeSelect && specificDaysContainer) {
    freqTypeSelect.addEventListener('change', (e) => {
      if (e.target.value === 'weekly_days') {
        specificDaysContainer.style.display = 'flex';
      } else {
        specificDaysContainer.style.display = 'none';
      }
    });
  }

  // Specific Days Click toggling
  const daySelectors = document.querySelectorAll('.day-selector-btn');
  daySelectors.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.classList.toggle('selected');
    });
  });

  // 7. Form Submission Handler
  const addHabitForm = document.getElementById('add-habit-form');
  if (addHabitForm) {
    addHabitForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nameInput = document.getElementById('habit-name-input');
      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) return;

      const freqType = freqTypeSelect ? freqTypeSelect.value : 'daily';
      const frequency = { type: freqType };

      if (freqType === 'weekly_days') {
        const days = [];
        daySelectors.forEach(btn => {
          if (btn.classList.contains('selected')) {
            days.push(parseInt(btn.getAttribute('data-day')));
          }
        });

        if (days.length === 0) {
          alert("Please select at least one day for your weekly frequency.");
          return;
        }
        frequency.days = days;
      }

      // Add habit via Storage CRUD
      addHabit({
        name,
        category: selectedCategory,
        frequency
      });

      // Award dynamic bonus XP for setting goals!
      awardXP(20, (newLevel) => {
        displayLevelUpOverlay(newLevel);
      });

      // Clear input fields and close modal
      nameInput.value = '';
      if (addModal) addModal.classList.remove('active');

      renderAll();
    });
  }

  // 8. (Seed button event listener removed for production release)

  // 9. Data Portability Actions (Export / Import)
  const exportBtn = document.getElementById('btn-export-data');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habitquest_backup_${formatDate(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  const importBtn = document.getElementById('btn-import-data');
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const success = importData(readerEvent.target.result);
          if (success) {
            alert("Database imported successfully!");
            renderAll();
          } else {
            alert("Failed to import database. Please verify JSON structure.");
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }

  // 10. Reflections custom Modal handlers
  const closeNoteModalBtn = document.getElementById('btn-close-note-modal');
  const noteModal = document.getElementById('reflection-note-modal');
  const noteForm = document.getElementById('reflection-note-form');

  if (closeNoteModalBtn && noteModal) {
    closeNoteModalBtn.addEventListener('click', () => {
      noteModal.classList.remove('active');
    });
  }

  if (noteModal) {
    noteModal.addEventListener('click', (e) => {
      if (e.target === noteModal) {
        noteModal.classList.remove('active');
      }
    });
  }

  if (noteForm) {
    noteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const habitId = document.getElementById('note-habit-id').value;
      const dateStr = document.getElementById('note-date').value;
      const textVal = document.getElementById('note-text-input').value.trim();

      const logs = getLogs();
      const existingIndex = logs.findIndex(l => l.habitId === habitId && l.date === dateStr);

      if (existingIndex > -1) {
        // Complete exists, update note
        logs[existingIndex].note = textVal;
        saveLogs(logs);
      } else {
        // Save note implies completions! Great user experience shortcut
        toggleLog(habitId, dateStr, textVal);
        
        // Award completion XP
        awardXP(XP_PER_COMPLETION, (newLevel) => {
          displayLevelUpOverlay(newLevel);
        });

        checkAchievements(
          (badgeAwarded) => {
            displayToastNotification(
              'Achievement Unlocked!',
              `${badgeAwarded.title} (+${badgeAwarded.xp} XP)`,
              '🏆',
              badgeAwarded.color
            );
          },
          (newLevel) => {
            displayLevelUpOverlay(newLevel);
          }
        );
      }

      if (noteModal) noteModal.classList.remove('active');
      renderAll();
    });
  }

  // 11. Edit Habit Settings Modal bindings
  const editModal = document.getElementById('edit-habit-modal');
  const closeEditModalBtn = document.getElementById('btn-close-edit-modal');
  const editForm = document.getElementById('edit-habit-form');

  if (closeEditModalBtn && editModal) {
    closeEditModalBtn.addEventListener('click', () => {
      editModal.classList.remove('active');
    });
  }

  if (editModal) {
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) {
        editModal.classList.remove('active');
      }
    });
  }

  // Category picker for Edit Modal (Genre Swapping!)
  const editCatPickerBtns = document.querySelectorAll('.edit-cat-picker-btn');
  editCatPickerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      editCatPickerBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      editModalSelectedCategory = btn.getAttribute('data-category');
    });
  });

  // Frequency type toggle for Edit Modal
  const editFreqTypeSelect = document.getElementById('edit-habit-freq-type');
  const editSpecificDaysContainer = document.getElementById('edit-form-specific-days-wrap');
  
  if (editFreqTypeSelect && editSpecificDaysContainer) {
    editFreqTypeSelect.addEventListener('change', (e) => {
      if (e.target.value === 'weekly_days') {
        editSpecificDaysContainer.style.display = 'flex';
      } else {
        editSpecificDaysContainer.style.display = 'none';
      }
    });
  }

  // Specific Days Click toggling for Edit Modal
  const editDaySelectors = document.querySelectorAll('.edit-day-selector-btn');
  editDaySelectors.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.classList.toggle('selected');
    });
  });

  // Form Submission for Editing Settings
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const habitId = document.getElementById('edit-habit-id').value;
      const nameVal = document.getElementById('edit-habit-name-input').value.trim();
      
      if (!nameVal) return;

      const freqType = editFreqTypeSelect.value;
      const frequency = { type: freqType };

      if (freqType === 'weekly_days') {
        const days = [];
        editDaySelectors.forEach(btn => {
          if (btn.classList.contains('selected')) {
            days.push(parseInt(btn.getAttribute('data-day')));
          }
        });

        if (days.length === 0) {
          alert("Please select at least one day for frequency.");
          return;
        }
        frequency.days = days;
      }

      // Call storage CRUD to update (Genre is swapped here!)
      updateHabit(habitId, {
        name: nameVal,
        category: editModalSelectedCategory,
        frequency
      });

      // Award dynamic bonus XP for editing/refining routines!
      awardXP(10, (newLevel) => {
        displayLevelUpOverlay(newLevel);
      });

      if (editModal) editModal.classList.remove('active');
      renderAll();
    });
  }
}
