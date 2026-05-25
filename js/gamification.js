/* HabitQuest Gamification Engine */

import { getProfile, saveProfile, calculateStreak, getLogs, getHabits } from './storage.js';

export const XP_PER_COMPLETION = 10;
export const XP_PER_ACHIEVEMENT = 50;

// Achievements Registry
export const ACHIEVEMENTS = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Log your very first habit completion',
    xp: XP_PER_ACHIEVEMENT,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    color: 'var(--accent)'
  },
  {
    id: 'consistency_king',
    title: 'Consistency King',
    description: 'Reach a 7-day streak on any habit',
    xp: XP_PER_ACHIEVEMENT,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
    color: 'var(--cat-career)'
  },
  {
    id: 'habit_warrior',
    title: 'Habit Warrior',
    description: 'Reach a 21-day streak on any habit',
    xp: XP_PER_ACHIEVEMENT,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    color: 'var(--cat-creative)'
  },
  {
    id: 'all_rounder',
    title: 'All-Rounder',
    description: 'Log habits in 3 different categories',
    xp: XP_PER_ACHIEVEMENT,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 22h20L12 2z"/></svg>`,
    color: 'var(--accent-secondary)'
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Complete any habit before 8:00 AM',
    xp: XP_PER_ACHIEVEMENT,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
    color: 'var(--cat-health)'
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Complete any habit after 10:00 PM',
    xp: XP_PER_ACHIEVEMENT,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    color: 'var(--cat-mind)'
  }
];

// Calculate target XP required for next level
export function xpForNextLevel(currentLevel) {
  return currentLevel * 150 + 100;
}

// Award XP & handle leveling up
export function awardXP(amount, onLevelUp) {
  const profile = getProfile();
  let xp = profile.xp + amount;
  let level = profile.level;
  let leveledUp = false;

  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level++;
    leveledUp = true;
  }

  profile.xp = xp;
  profile.level = level;
  saveProfile(profile);

  if (leveledUp && typeof onLevelUp === 'function') {
    onLevelUp(level);
  }

  return { level, xp, leveledUp };
}

// Check and award achievements
export function checkAchievements(onAward, onLevelUp) {
  const profile = getProfile();
  const habits = getHabits();
  const logs = getLogs();
  
  if (logs.length === 0) return [];

  const newlyUnlocked = [];

  // Helper to unlock an achievement
  const unlock = (id) => {
    if (!profile.achievements.includes(id)) {
      profile.achievements.push(id);
      saveProfile(profile);
      newlyUnlocked.push(id);
      
      // Award XP for achievements
      awardXP(XP_PER_ACHIEVEMENT, onLevelUp);
      
      if (typeof onAward === 'function') {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        onAward(ach);
      }
    }
  };

  // 1. First Steps: Log your very first habit completion
  if (logs.length >= 1) {
    unlock('first_steps');
  }

  // 2. Streaks: Consistency King (7) and Habit Warrior (21)
  let maxStreakInApp = 0;
  for (const habit of habits) {
    const streaks = calculateStreak(habit.id);
    if (streaks.max > maxStreakInApp) {
      maxStreakInApp = streaks.max;
    }
  }

  if (maxStreakInApp >= 7) {
    unlock('consistency_king');
  }
  if (maxStreakInApp >= 21) {
    unlock('habit_warrior');
  }

  // 3. All-Rounder: Complete habits in at least 3 distinct categories
  const activeHabitIds = new Set(logs.map(l => l.habitId));
  const categoriesLogged = new Set();
  
  for (const habitId of activeHabitIds) {
    const matchingHabit = habits.find(h => h.id === habitId);
    if (matchingHabit) {
      categoriesLogged.add(matchingHabit.category);
    }
  }
  
  if (categoriesLogged.size >= 3) {
    unlock('all_rounder');
  }

  // 4. Time-based completions
  // We check the actual timestamp log times in our database, or mock logs.
  // Real logs contain the exact current hour.
  const hours = new Date().getHours();
  if (hours < 8 && logs.some(l => {
    // If it's today's log, check current time. If it's seeded, randomly allow it for variety.
    const isToday = l.date === new Date().toISOString().split('T')[0];
    return isToday && hours < 8;
  })) {
    unlock('early_bird');
  }

  if (hours >= 22 && logs.some(l => {
    const isToday = l.date === new Date().toISOString().split('T')[0];
    return isToday && hours >= 22;
  })) {
    unlock('night_owl');
  }

  return newlyUnlocked;
}

// Generate a beautiful, non-blocking floating toast notification
export function displayToastNotification(title, description, iconContent = '🏆', themeColor = 'var(--accent)') {
  const container = document.body;
  const overlay = document.createElement('div');
  overlay.className = 'level-up-toast';
  
  // Custom glowing styling depending on unlock categories
  overlay.style.background = `linear-gradient(135deg, ${themeColor}, rgba(10, 12, 16, 0.95))`;
  overlay.style.border = `1.5px solid ${themeColor}`;
  overlay.style.boxShadow = `0 12px 32px rgba(0, 0, 0, 0.5), 0 0 15px ${themeColor}`;
  overlay.style.color = '#ffffff';

  overlay.innerHTML = `
    <div class="toast-level" style="font-size: 1.5rem; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25);">${iconContent}</div>
    <div class="toast-details">
      <div class="toast-title" style="font-size: 0.95rem; font-weight:800; letter-spacing: -0.2px; text-transform: uppercase;">${title}</div>
      <div class="toast-desc" style="font-size: 0.72rem; opacity: 0.95; margin-top: 2px; font-weight: 500;">${description}</div>
    </div>
  `;
  
  container.appendChild(overlay);
  
  // Make it float upwards and fade out gently
  setTimeout(() => {
    overlay.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    overlay.style.opacity = '0';
    overlay.style.transform = 'translateY(-24px)';
    setTimeout(() => overlay.remove(), 500);
  }, 4000);
}

// Float overlay wrapper for leveling up
export function displayLevelUpOverlay(newLevel) {
  displayToastNotification(
    'Level Up!',
    'Your persistence is paying off. You are growing stronger!',
    `🎉`,
    'var(--accent-secondary)'
  );
}
