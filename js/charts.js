/* HabitQuest Interactive SVG Visualizations Engine */

import { getLogs, getHabits, formatDate } from './storage.js';

// Render today's progress ring
export function renderProgressRing(selector, percentage) {
  const container = document.querySelector(selector);
  if (!container) return;

  const pct = Math.min(100, Math.max(0, Math.round(percentage || 0)));
  const radius = 60;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  container.innerHTML = `
    <svg class="circular-chart" viewBox="0 0 140 140" width="140" height="140">
      <circle class="circle-bg" cx="70" cy="70" r="${radius}" stroke-width="${strokeWidth}" />
      <circle class="circle-fill" cx="70" cy="70" r="${radius}" 
              stroke-width="${strokeWidth}"
              stroke-dasharray="${circumference}" 
              stroke-dashoffset="${strokeDashoffset}" 
              transform="rotate(-90 70 70)"/>
    </svg>
    <div class="progress-inner-text">
      <span class="progress-pct">${pct}%</span>
      <span class="progress-label">Today</span>
    </div>
  `;
}

// Render GitHub style Heatmap contribution grid
export function renderHeatmap(selector) {
  const container = document.querySelector(selector);
  if (!container) return;

  const logs = getLogs();
  const habits = getHabits();
  
  if (habits.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);">Seed sample data or create habits to see your consistency heatmap!</div>`;
    return;
  }

  // Generate date grid for the past 24 weeks (168 days)
  const numDays = 168; // 24 weeks
  const today = new Date();
  
  // Back up to a Monday 24 weeks ago
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - numDays);
  // Align to Monday
  const dayShift = startDay.getDay() === 0 ? 6 : startDay.getDay() - 1;
  startDay.setDate(startDay.getDate() - dayShift);

  let html = `<div class="heatmap-grid">`;
  
  // Calculate completion map by date
  const dateMap = {};
  for (const log of logs) {
    if (log.completed) {
      dateMap[log.date] = (dateMap[log.date] || 0) + 1;
    }
  }

  const checkDate = new Date(startDay);
  const totalDaysToDraw = numDays + dayShift + (7 - (today.getDay() === 0 ? 7 : today.getDay()));

  const monthLabels = [];
  let prevMonth = -1;

  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let d = 0; d < totalDaysToDraw; d++) {
    const dateStr = formatDate(checkDate);
    const count = dateMap[dateStr] || 0;
    
    // Calculate level (0-4) based on completions
    let level = 0;
    if (count > 0) {
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count === 3) level = 3;
      else level = 4;
    }

    // Capture Month label transitions
    const currMonth = checkDate.getMonth();
    if (currMonth !== prevMonth && d % 7 === 0) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthLabels.push({ index: Math.floor(d / 7), label: monthNames[currMonth] });
      prevMonth = currMonth;
    }

    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedLabelDate = checkDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const tooltipText = `${count} completion${count !== 1 ? 's' : ''} on ${dayName}, ${formattedLabelDate}`;

    const checkDateNormalized = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
    const isFuture = checkDateNormalized > todayNormalized;

    if (isFuture) {
      html += `
        <div class="heatmap-day" style="opacity: 0; pointer-events: none;"></div>
      `;
    } else {
      html += `
        <div class="heatmap-day tooltip" 
             data-date="${dateStr}" 
             data-level="${level}" 
             data-tooltip="${tooltipText}">
        </div>
      `;
    }

    checkDate.setDate(checkDate.getDate() + 1);
  }

  html += `</div>`;

  // Simple layout of months across the weeks
  const totalWeeks = Math.ceil(totalDaysToDraw / 7);
  const activeLabels = new Array(totalWeeks).fill('');

  // Draw month labels aligned perfectly to columns!
  let labelsHtml = `<div class="heatmap-labels" style="display: grid; grid-template-columns: repeat(${totalWeeks}, 18px); gap: 4px; margin-top: 8px; justify-content: start;">`;
  
  for (const item of monthLabels) {
    if (item.index < totalWeeks) {
      activeLabels[item.index] = item.label;
    }
  }

  for (let w = 0; w < totalWeeks; w++) {
    if (activeLabels[w]) {
      labelsHtml += `<span style="grid-column: ${w + 1}; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-align: left; overflow: visible; white-space: nowrap;">${activeLabels[w]}</span>`;
    }
  }
  labelsHtml += `</div>`;

  container.innerHTML = html + labelsHtml;
}

// Render weekly completion trend graph (past 6 weeks)
export function renderProgressTrend(selector) {
  const container = document.querySelector(selector);
  if (!container) return;

  const logs = getLogs();
  const habits = getHabits();

  if (habits.length === 0) {
    container.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 20px;">Add habits to see your weekly progress trend!</div>`;
    return;
  }

  // Calculate completion percentage for the last 6 weeks
  const dataPoints = [];
  const today = new Date();

  for (let w = 5; w >= 0; w--) {
    // Week bounds
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() - w * 7);
    const startOfWeek = new Date(endOfWeek);
    startOfWeek.setDate(endOfWeek.getDate() - 6);

    const startOfWeekStr = formatDate(startOfWeek);
    const endOfWeekStr = formatDate(endOfWeek);

    // Count completions in this week range
    let completionsCount = 0;
    const daysInWeek = 7;
    const possibleLogs = habits.length * daysInWeek;

    const startDayTime = new Date(startOfWeekStr).getTime();
    const endDayTime = new Date(endOfWeekStr).getTime() + 86400000; // include full day

    for (const log of logs) {
      if (log.completed) {
        const logTime = new Date(log.date).getTime();
        if (logTime >= startDayTime && logTime < endDayTime) {
          completionsCount++;
        }
      }
    }

    const pct = possibleLogs > 0 ? (completionsCount / possibleLogs) * 100 : 0;
    dataPoints.push({
      label: w === 0 ? 'This Week' : `W-${w}`,
      value: Math.round(pct)
    });
  }

  // Render SVG Line Chart
  const svgWidth = 320;
  const svgHeight = 120;
  const paddingX = 30;
  const paddingY = 20;

  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Compute points
  const points = dataPoints.map((d, index) => {
    const x = paddingX + (index / (dataPoints.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - (d.value / 100) * chartHeight;
    return { x, y, value: d.value, label: d.label };
  });

  // SVG paths
  let linePath = `M ${points[0].x} ${points[0].y}`;
  let areaPath = `M ${points[0].x} ${svgHeight - paddingY} L ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    linePath += ` L ${points[i].x} ${points[i].y}`;
    areaPath += ` L ${points[i].x} ${points[i].y}`;
  }
  areaPath += ` L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[points.length - 1].x} ${svgHeight - paddingY} Z`;

  // Draw points circles and labels
  let circlesHtml = '';
  let labelsHtml = '';
  
  for (const p of points) {
    circlesHtml += `
      <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="var(--accent-secondary)" stroke="var(--bg-secondary)" stroke-width="2" class="tooltip" data-tooltip="${p.value}% completed"/>
    `;
    labelsHtml += `
      <text x="${p.x}" y="${svgHeight - 4}" font-size="8" fill="var(--text-muted)" text-anchor="middle" font-weight="700">${p.label}</text>
    `;
  }

  container.innerHTML = `
    <div style="position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px;">
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="120" style="overflow: visible;">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent-secondary)" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="var(--accent-secondary)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        
        <!-- Grid lines -->
        <line x1="${paddingX}" y1="${paddingY}" x2="${svgWidth - paddingX}" y2="${paddingY}" stroke="var(--glass-border)" stroke-width="0.5" stroke-dasharray="2"/>
        <line x1="${paddingX}" y1="${paddingY + chartHeight / 2}" x2="${svgWidth - paddingX}" y2="${paddingY + chartHeight / 2}" stroke="var(--glass-border)" stroke-width="0.5" stroke-dasharray="2"/>
        <line x1="${paddingX}" y1="${paddingY + chartHeight}" x2="${svgWidth - paddingX}" y2="${paddingY + chartHeight}" stroke="var(--glass-border)" stroke-width="0.8"/>

        <!-- Area fill under the line -->
        <path d="${areaPath}" fill="url(#chartGradient)" />

        <!-- Line -->
        <path d="${linePath}" fill="none" stroke="var(--accent-secondary)" stroke-width="2.5" stroke-linecap="round" />

        <!-- Nodes and Labels -->
        ${circlesHtml}
        ${labelsHtml}
      </svg>
      <div style="font-size: 0.8rem; color: var(--text-secondary); display:flex; justify-content: space-between; width: 100%; padding: 0 10px; border-top: 1px solid var(--glass-border); padding-top: 8px;">
        <span>Current Week Consistency:</span>
        <span style="font-weight: 800; color: var(--accent-secondary);">${points[points.length - 1].value}%</span>
      </div>
    </div>
  `;
}

// Render category breakdown progress bars
export function renderCategoryStats(selector) {
  const container = document.querySelector(selector);
  if (!container) return;

  const logs = getLogs();
  const habits = getHabits();

  const categories = [
    { key: 'health', name: 'Health & Fitness', color: 'var(--cat-health)' },
    { key: 'mind', name: 'Mind & Focus', color: 'var(--cat-mind)' },
    { key: 'career', name: 'Career & Learning', color: 'var(--cat-career)' },
    { key: 'social', name: 'Relationships', color: 'var(--cat-social)' },
    { key: 'finance', name: 'Finance & Wealth', color: 'var(--cat-finance)' },
    { key: 'creative', name: 'Creative & Play', color: 'var(--cat-creative)' }
  ];

  // Count completions in each category
  const categoryCounts = { health: 0, mind: 0, career: 0, social: 0, finance: 0, creative: 0 };
  let totalCompletions = 0;

  for (const log of logs) {
    if (log.completed) {
      const parentHabit = habits.find(h => h.id === log.habitId);
      if (parentHabit && categoryCounts[parentHabit.category] !== undefined) {
        categoryCounts[parentHabit.category]++;
        totalCompletions++;
      }
    }
  }

  let html = `<div class="category-bars">`;
  
  for (const cat of categories) {
    const count = categoryCounts[cat.key];
    const pct = totalCompletions > 0 ? (count / totalCompletions) * 100 : 0;
    
    html += `
      <div class="cat-progress-item" style="--cat-color: ${cat.color}">
        <div class="cat-progress-info">
          <span class="cat-progress-name">${cat.name}</span>
          <span class="cat-progress-count">${count} log${count !== 1 ? 's' : ''} (${Math.round(pct)}%)</span>
        </div>
        <div class="cat-progress-bar-bg">
          <div class="cat-progress-bar-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }
  
  html += `</div>`;
  container.innerHTML = html;
}
