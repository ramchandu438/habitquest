/* HabitQuest Storage and Data Engine */

const STORAGE_KEYS = {
  HABITS: 'hq_habits',
  LOGS: 'hq_logs',
  PROFILE: 'hq_profile'
};

// Default User Profile
const DEFAULT_PROFILE = {
  name: 'Habit Hero',
  level: 1,
  xp: 0,
  achievements: []
};

// Generate UUID
export function generateId() {
  return 'hq-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

// Date formatter YYYY-MM-DD
export function formatDate(date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

// Storage Operations
export function getHabits() {
  try {
    const habits = localStorage.getItem(STORAGE_KEYS.HABITS);
    return habits ? JSON.parse(habits) : [];
  } catch (e) {
    console.error("Failed to parse habits", e);
    return [];
  }
}

export function saveHabits(habits) {
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
}

export function getLogs() {
  try {
    const logs = localStorage.getItem(STORAGE_KEYS.LOGS);
    return logs ? JSON.parse(logs) : [];
  } catch (e) {
    console.error("Failed to parse logs", e);
    return [];
  }
}

export function saveLogs(logs) {
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
}

export function getProfile() {
  try {
    const profile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return profile ? JSON.parse(profile) : { ...DEFAULT_PROFILE };
  } catch (e) {
    console.error("Failed to parse profile", e);
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

// CRUD Operations
export function addHabit(habitData) {
  const habits = getHabits();
  const newHabit = {
    id: generateId(),
    name: habitData.name,
    category: habitData.category || 'health',
    frequency: habitData.frequency || { type: 'daily' },
    createdAt: new Date().toISOString(),
    archived: false
  };
  habits.push(newHabit);
  saveHabits(habits);
  return newHabit;
}

export function deleteHabit(habitId) {
  // Delete habit
  let habits = getHabits();
  habits = habits.filter(h => h.id !== habitId);
  saveHabits(habits);

  // Delete associated logs
  let logs = getLogs();
  logs = logs.filter(l => l.habitId !== habitId);
  saveLogs(logs);
}

export function updateHabit(habitId, updatedData) {
  const habits = getHabits();
  const index = habits.findIndex(h => h.id === habitId);
  if (index > -1) {
    habits[index].name = updatedData.name;
    habits[index].category = updatedData.category;
    habits[index].frequency = updatedData.frequency;
    saveHabits(habits);
    return habits[index];
  }
  return null;
}

// Logging toggle
export function toggleLog(habitId, dateStr, note = '') {
  const logs = getLogs();
  const existingIndex = logs.findIndex(l => l.habitId === habitId && l.date === dateStr);
  let wasCompleted = false;

  if (existingIndex > -1) {
    // Delete log (untoggle)
    logs.splice(existingIndex, 1);
    wasCompleted = false;
  } else {
    // Add log
    logs.push({
      id: generateId(),
      habitId,
      date: dateStr,
      note,
      completed: true
    });
    wasCompleted = true;
  }

  saveLogs(logs);
  return wasCompleted;
}

// Get completion status
export function isCompleted(habitId, dateStr) {
  const logs = getLogs();
  return logs.some(l => l.habitId === habitId && l.date === dateStr);
}

// Calculate streaks
export function calculateStreak(habitId) {
  const logs = getLogs().filter(l => l.habitId === habitId).map(l => l.date);
  if (logs.length === 0) return { current: 0, max: 0 };

  const sortedDates = [...new Set(logs)].sort((a, b) => new Date(b) - new Date(a));
  
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;

  const todayStr = formatDate(new Date());
  const yesterdayStr = formatDate(new Date(Date.now() - 86400000));
  
  const hasLoggedToday = sortedDates.includes(todayStr);
  const hasLoggedYesterday = sortedDates.includes(yesterdayStr);

  // If not logged today and not logged yesterday, current streak is 0
  if (!hasLoggedToday && !hasLoggedYesterday) {
    currentStreak = 0;
  }

  // Calculate current streak
  let checkDate = new Date(hasLoggedToday ? todayStr : yesterdayStr);
  while (true) {
    const formattedCheck = formatDate(checkDate);
    if (sortedDates.includes(formattedCheck)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate max streak
  const chronologicalDates = [...new Set(logs)].sort((a, b) => new Date(a) - new Date(b));
  let prevDate = null;

  for (const dateStr of chronologicalDates) {
    const currDate = new Date(dateStr);
    
    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const diffTime = Math.abs(currDate - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        if (tempStreak > maxStreak) maxStreak = tempStreak;
        tempStreak = 1;
      }
    }
    prevDate = currDate;
  }
  
  if (tempStreak > maxStreak) maxStreak = tempStreak;
  if (currentStreak > maxStreak) maxStreak = currentStreak;

  return {
    current: currentStreak,
    max: maxStreak
  };
}

// Export Database
export function exportData() {
  const data = {
    habits: getHabits(),
    logs: getLogs(),
    profile: getProfile()
  };
  return JSON.stringify(data, null, 2);
}

// Import Database
export function importData(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    if (data.habits && data.logs && data.profile) {
      saveHabits(data.habits);
      saveLogs(data.logs);
      saveProfile(data.profile);
      return true;
    }
  } catch (e) {
    console.error('Invalid JSON imported', e);
  }
  return false;
}

// Seed Mock Data
export function seedSampleData() {
  localStorage.clear();

  // Create 5 habits
  const habits = [
    {
      id: 'mock-1',
      name: 'Hydrate 3L Water',
      category: 'health',
      frequency: { type: 'daily' },
      createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
      archived: false
    },
    {
      id: 'mock-2',
      name: 'Mindful Meditation',
      category: 'mind',
      frequency: { type: 'daily' },
      createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
      archived: false
    },
    {
      id: 'mock-3',
      name: 'LeetCode & Learning',
      category: 'career',
      frequency: { type: 'daily' },
      createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
      archived: false
    },
    {
      id: 'mock-4',
      name: 'Call a Friend / Family',
      category: 'social',
      frequency: { type: 'weekly_days', days: [1, 3, 5, 7] }, // Mon, Wed, Fri, Sun
      createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
      archived: false
    },
    {
      id: 'mock-5',
      name: 'Journal & Expense Log',
      category: 'finance',
      frequency: { type: 'daily' },
      createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
      archived: false
    }
  ];

  // Logs Generation (Spans 30 days)
  const logs = [];
  const startDay = 30;
  
  // Custom reflections notes for variety
  const notesPool = [
    "Felt incredibly energetic today!",
    "Hard to get started, but glad I did.",
    "Very peaceful session.",
    "Felt distracted, but pushed through.",
    "Completed in the evening. Keep consistent!",
    "Super productive today.",
    "Perfect routine execution.",
    "Felt amazing after completing this."
  ];

  for (let i = startDay; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon...

    // 1. Water habit - High completion rate (~85%)
    if (Math.random() < 0.85 || i === 0 || i === 1) {
      logs.push({
        id: generateId(),
        habitId: 'mock-1',
        date: dateStr,
        note: i % 7 === 0 ? "Drank 3.5 liters today, feeling great!" : "",
        completed: true
      });
    }

    // 2. Meditation habit - Good rate (~75%)
    if (Math.random() < 0.75 || i === 0 || i === 1) {
      logs.push({
        id: generateId(),
        habitId: 'mock-2',
        date: dateStr,
        note: i % 8 === 0 ? notesPool[Math.floor(Math.random() * notesPool.length)] : "",
        completed: true
      });
    }

    // 3. Coding habit - Moderate rate (~65%)
    if (Math.random() < 0.65 || i === 1) {
      logs.push({
        id: generateId(),
        habitId: 'mock-3',
        date: dateStr,
        note: i % 6 === 0 ? "Solved a Medium problem on Arrays." : "",
        completed: true
      });
    }

    // 4. Social - Check day of week (Mon(1), Wed(3), Fri(5), Sun(0)) - Rate (~80%)
    if ([1, 3, 5, 0].includes(dayOfWeek)) {
      if (Math.random() < 0.80 || i === 1) {
        logs.push({
          id: generateId(),
          habitId: 'mock-4',
          date: dateStr,
          note: i % 4 === 0 ? "Caught up with old friends, had a laugh." : "",
          completed: true
        });
      }
    }

    // 5. Expense log - High rate (~90%)
    if (Math.random() < 0.90 || i === 0 || i === 1) {
      logs.push({
        id: generateId(),
        habitId: 'mock-5',
        date: dateStr,
        note: i % 7 === 0 ? "Balanced budgets and saved $20 today." : "",
        completed: true
      });
    }
  }

  // Calculate total completions to assign initial XP/Level
  const totalCompletions = logs.length;
  // Let's assume each completion is 10 XP + some streak bonuses. Let's make it Level 4, 380 XP.
  const profile = {
    name: 'Habit Champion',
    level: 4,
    xp: 380,
    achievements: ['first_steps', 'consistency_king', 'all_rounder']
  };

  saveHabits(habits);
  saveLogs(logs);
  saveProfile(profile);

  return { habits, logs, profile };
}
