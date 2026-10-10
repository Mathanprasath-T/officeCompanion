const DailyPlan = require('../models/DailyPlan');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { calculateDeterministicPriority } = require('./priorityEngine');

/**
 * Parse human readable estimated time string into integer minutes
 */
function parseEstimatedMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 30;
  const lower = timeStr.toLowerCase().trim();

  let minutes = 0;
  const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hour|hours)/);
  if (hourMatch) {
    minutes += Math.round(parseFloat(hourMatch[1]) * 60);
  }

  const minMatch = lower.match(/(\d+)\s*(?:m|min|mins|minute|minutes)/);
  if (minMatch) {
    minutes += parseInt(minMatch[1], 10);
  }

  if (minutes === 0) {
    const rawNumber = parseInt(lower, 10);
    if (!isNaN(rawNumber) && rawNumber > 0) {
      minutes = rawNumber <= 12 ? rawNumber * 60 : rawNumber;
    } else {
      minutes = 30;
    }
  }

  return Math.max(15, Math.min(minutes, 240)); // Clamped between 15m and 4h
}

/**
 * Format minutes to "Xh Ym" or "X min"
 */
function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * Helper to convert minutes from midnight to "hh:mm A" format
 */
function minutesToTimeStr(totalMinutes) {
  const normMinutes = totalMinutes % (24 * 60);
  let hours = Math.floor(normMinutes / 60);
  const mins = normMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const padMin = mins < 10 ? `0${mins}` : mins;
  const padHr = hours < 10 ? `0${hours}` : hours;
  return `${padHr}:${padMin} ${period}`;
}

/**
 * Helper to parse "hh:mm A" to minutes from midnight
 */
function timeStrToMinutes(timeStr) {
  if (!timeStr) return 9 * 60; // default 09:00 AM
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 9 * 60;
  let hrs = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hrs < 12) hrs += 12;
  if (period === 'AM' && hrs === 12) hrs = 0;
  return hrs * 60 + mins;
}

/**
 * Generate human-understandable explanation why this task is ordered where it is
 */
function generatePlanReason(task, isTop) {
  const reasons = [];
  const now = new Date();
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const duration = parseEstimatedMinutes(task.estimatedTime);

  if (deadline) {
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < 0) {
      reasons.push('Overdue task requiring immediate attention');
    } else if (diffHours <= 24) {
      reasons.push('Due today');
    } else if (diffHours <= 72) {
      reasons.push('Approaching deadline within 3 days');
    }
  }

  if (task.priority === 'urgent' || task.importance === 'urgent') {
    reasons.push('Marked critical priority');
  } else if (task.priority === 'high' || task.importance === 'high') {
    reasons.push('High business priority');
  }

  if (task.status === 'in_progress') {
    reasons.push('Currently in progress (maintaining momentum)');
  }

  reasons.push(`Estimated effort: ${formatMinutes(duration)}`);

  if (isTop) {
    return reasons.join(', and ') + '.';
  }
  return reasons.join(' • ');
}

/**
 * Build daily schedule items from sorted task list
 */
function buildScheduleItems(tasks, startMinutes = 9 * 60) {
  const items = [];
  let currentMinutes = startMinutes;
  let consecutiveWorkMinutes = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const duration = parseEstimatedMinutes(task.estimatedTime);

    // If accumulated continuous work >= 90 mins, insert a short 15-min break
    if (consecutiveWorkMinutes >= 90) {
      const breakStart = currentMinutes;
      const breakEnd = currentMinutes + 15;
      items.push({
        type: 'break',
        title: 'Recharge & Coffee Break',
        startTime: minutesToTimeStr(breakStart),
        endTime: minutesToTimeStr(breakEnd),
        durationMinutes: 15,
        priority: 'none',
        reason: 'Rest window after 90+ minutes of continuous deep work',
        isCompleted: false,
      });
      currentMinutes = breakEnd;
      consecutiveWorkMinutes = 0;
    }

    const taskStart = currentMinutes;
    const taskEnd = currentMinutes + duration;
    const reason = generatePlanReason(task, i === 0);

    items.push({
      taskId: task._id,
      type: 'task',
      title: task.title,
      startTime: minutesToTimeStr(taskStart),
      endTime: minutesToTimeStr(taskEnd),
      durationMinutes: duration,
      priority: task.priority || 'medium',
      reason,
      isCompleted: task.status === 'completed',
    });

    currentMinutes = taskEnd;
    consecutiveWorkMinutes += duration;
  }

  return items;
}

/**
 * Get or generate today's plan
 */
async function getTodayPlan(userId, forceRegenerate = false) {
  const todayStr = new Date().toISOString().slice(0, 10);

  let plan = await DailyPlan.findOne({ userId, dateString: todayStr }).populate({
    path: 'items.taskId',
    model: 'Task',
  });

  if (!plan || forceRegenerate) {
    plan = await generateTodayPlan(userId, forceRegenerate);
  } else {
    // Refresh task statuses in plan items
    let modified = false;
    for (const item of plan.items) {
      if (item.taskId && typeof item.taskId === 'object') {
        const currentStatus = item.taskId.status;
        const shouldBeCompleted = currentStatus === 'completed';
        if (item.isCompleted !== shouldBeCompleted) {
          item.isCompleted = shouldBeCompleted;
          modified = true;
        }
      }
    }
    if (modified) {
      await plan.save();
    }
  }

  return formatPlanResponse(plan, userId);
}

/**
 * Deterministically generate today's plan from user tasks
 */
async function generateTodayPlan(userId, forceRegenerate = false) {
  const todayStr = new Date().toISOString().slice(0, 10);

  let existingPlan = await DailyPlan.findOne({ userId, dateString: todayStr });
  const excludedIds = existingPlan ? existingPlan.excludedTaskIds.map((id) => String(id)) : [];
  const customOrder = (!forceRegenerate && existingPlan?.customOrder?.length > 0)
    ? existingPlan.customOrder.map((id) => String(id))
    : [];

  // Fetch all non-completed tasks (and also completed today tasks if needed)
  const allTasks = await Task.find({
    createdBy: userId,
  });

  const activeTasks = allTasks.filter(
    (t) => t.status !== 'completed' && !excludedIds.includes(String(t._id))
  );

  // Score tasks deterministically
  const scoredTasks = activeTasks.map((t) => {
    const analysis = calculateDeterministicPriority(t);
    let finalScore = analysis.score;

    // Prioritize currently in_progress task to stay at top
    if (t.status === 'in_progress') {
      finalScore += 25;
    }

    return {
      task: t,
      score: finalScore,
    };
  });

  let sortedTasks = [];
  if (customOrder.length > 0) {
    // Follow custom order for specified tasks, then append remaining sorted by score
    const taskMap = new Map(scoredTasks.map((st) => [String(st.task._id), st.task]));
    for (const id of customOrder) {
      if (taskMap.has(id)) {
        sortedTasks.push(taskMap.get(id));
        taskMap.delete(id);
      }
    }
    const remaining = Array.from(taskMap.values());
    remaining.sort((a, b) => {
      const scoreA = scoredTasks.find((st) => String(st.task._id) === String(a._id))?.score || 0;
      const scoreB = scoredTasks.find((st) => String(st.task._id) === String(b._id))?.score || 0;
      return scoreB - scoreA;
    });
    sortedTasks.push(...remaining);
  } else {
    scoredTasks.sort((a, b) => b.score - a.score);
    sortedTasks = scoredTasks.map((st) => st.task);
  }

  const startTimeStr = existingPlan?.workStartTime || '09:00 AM';
  const startMinutes = timeStrToMinutes(startTimeStr);
  const items = buildScheduleItems(sortedTasks, startMinutes);

  if (!existingPlan) {
    existingPlan = new DailyPlan({
      userId,
      dateString: todayStr,
      workStartTime: startTimeStr,
      workHours: 8,
      items,
      excludedTaskIds: [],
      customOrder: sortedTasks.map((t) => t._id),
    });
  } else {
    existingPlan.items = items;
    if (forceRegenerate) {
      existingPlan.customOrder = sortedTasks.map((t) => t._id);
    }
  }

  await existingPlan.save();

  await Activity.create({
    type: 'plan_generated',
    description: `Generated daily work plan with ${sortedTasks.length} scheduled tasks`,
    userId,
  });

  return DailyPlan.findById(existingPlan._id).populate({
    path: 'items.taskId',
    model: 'Task',
  });
}

/**
 * Reorder tasks in today's plan
 */
async function reorderPlan(userId, orderedTaskIds) {
  const todayStr = new Date().toISOString().slice(0, 10);
  let plan = await DailyPlan.findOne({ userId, dateString: todayStr });

  if (!plan) {
    plan = await generateTodayPlan(userId);
  }

  const tasks = await Task.find({
    _id: { $in: orderedTaskIds },
    createdBy: userId,
  });

  const taskMap = new Map(tasks.map((t) => [String(t._id), t]));
  const reorderedTasks = [];

  for (const id of orderedTaskIds) {
    if (taskMap.has(String(id))) {
      reorderedTasks.push(taskMap.get(String(id)));
    }
  }

  const startMinutes = timeStrToMinutes(plan.workStartTime || '09:00 AM');
  plan.items = buildScheduleItems(reorderedTasks, startMinutes);
  plan.customOrder = reorderedTasks.map((t) => t._id);

  await plan.save();

  return formatPlanResponse(
    await DailyPlan.findById(plan._id).populate({
      path: 'items.taskId',
      model: 'Task',
    }),
    userId
  );
}

/**
 * Include or exclude a task from today's plan
 */
async function toggleTaskInPlan(userId, taskId, include) {
  const todayStr = new Date().toISOString().slice(0, 10);
  let plan = await DailyPlan.findOne({ userId, dateString: todayStr });

  if (!plan) {
    plan = await generateTodayPlan(userId);
  }

  const taskIdStr = String(taskId);
  let excluded = plan.excludedTaskIds.map((id) => String(id));

  if (include) {
    excluded = excluded.filter((id) => id !== taskIdStr);
  } else {
    if (!excluded.includes(taskIdStr)) {
      excluded.push(taskIdStr);
    }
  }

  plan.excludedTaskIds = excluded;
  await plan.save();

  return formatPlanResponse(await generateTodayPlan(userId, false), userId);
}

/**
 * Build rich, structured response for UI
 */
async function formatPlanResponse(planDoc, userId) {
  const allUserTasks = await Task.find({ createdBy: userId });
  const planItems = planDoc?.items || [];

  const taskItems = planItems.filter((i) => i.type === 'task');
  const taskCount = taskItems.length;

  let totalEstimatedWorkMinutes = 0;
  let highPriorityCount = 0;

  taskItems.forEach((item) => {
    totalEstimatedWorkMinutes += item.durationMinutes || 30;
    if (item.priority === 'urgent' || item.priority === 'high') {
      highPriorityCount++;
    }
  });

  const availableMinutes = (planDoc?.workHours || 8) * 60;

  // Real DB progress calculation
  const completedCount = allUserTasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = allUserTasks.filter((t) => t.status === 'in_progress').length;
  const remainingCount = allUserTasks.filter((t) => t.status === 'pending').length;

  // Available tasks not yet in plan
  const planTaskIds = new Set(
    taskItems
      .map((i) => (i.taskId?._id ? String(i.taskId._id) : String(i.taskId)))
      .filter(Boolean)
  );

  const availableTasks = allUserTasks
    .filter((t) => t.status !== 'completed' && !planTaskIds.has(String(t._id)))
    .map((t) => ({
      _id: t._id,
      title: t.title,
      priority: t.priority,
      estimatedTime: t.estimatedTime,
      deadline: t.deadline,
      status: t.status,
    }));

  return {
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    workStartTime: planDoc?.workStartTime || '09:00 AM',
    metrics: {
      tasksToday: taskCount,
      highPriority: highPriorityCount,
      estimatedWorkMinutes: totalEstimatedWorkMinutes,
      estimatedWorkFormatted: formatMinutes(totalEstimatedWorkMinutes),
      availableTimeMinutes: availableMinutes,
      availableTimeFormatted: `${planDoc?.workHours || 8}h`,
    },
    progress: {
      completed: completedCount,
      inProgress: inProgressCount,
      remaining: remainingCount,
      total: allUserTasks.length,
    },
    planItems: planItems.map((item) => ({
      _id: item._id,
      taskId: item.taskId?._id || item.taskId || null,
      type: item.type,
      title: item.title,
      startTime: item.startTime,
      endTime: item.endTime,
      durationMinutes: item.durationMinutes,
      durationFormatted: formatMinutes(item.durationMinutes),
      priority: item.priority,
      reason: item.reason,
      isCompleted: Boolean(item.isCompleted || item.taskId?.status === 'completed'),
      taskDetails: item.taskId && typeof item.taskId === 'object' ? item.taskId : null,
    })),
    availableTasks,
  };
}

module.exports = {
  getTodayPlan,
  generateTodayPlan,
  reorderPlan,
  toggleTaskInPlan,
  parseEstimatedMinutes,
  formatMinutes,
};
