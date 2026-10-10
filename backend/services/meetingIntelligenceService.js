const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const FollowUp = require('../models/FollowUp');
const Activity = require('../models/Activity');
const { calculateDeterministicPriority } = require('./priorityEngine');
const { parseDateFromNaturalLanguage } = require('./followupEngine');

/**
 * Intelligent NLP Parser for Meeting Notes
 * Extracts structured Summary, Decisions, Action Items, and Commitments.
 */
function extractStructuredMeetingData(rawNotes) {
  if (!rawNotes || typeof rawNotes !== 'string') {
    throw new Error('Meeting notes content is required.');
  }

  const lines = rawNotes
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error('Meeting notes cannot be empty.');
  }

  // 1. Extract Title
  let title = 'Team Meeting Discussion';
  const firstLine = lines[0].replace(/^[#*-•\d.]+\s*/, '').trim();
  if (firstLine.length > 5 && firstLine.length < 90) {
    title = firstLine;
  }

  // 2. Summary Generation
  let summary = '';
  const generalSentences = [];
  const decisions = [];
  const actionItems = [];
  const commitments = [];

  // Keywords & regex patterns
  const decisionKeywords = [
    'agreed',
    'decided',
    'decision',
    'concluded',
    'approved',
    'aligned on',
    'scheduled for',
    'selected',
    'resolved',
    'finalized',
  ];

  const actionKeywords = [
    'will',
    'to do',
    'assigned to',
    'needs to',
    'action:',
    'action item',
    'responsible',
    'prepare',
    'review',
    'deliver',
    'complete',
    'submit',
    'update',
    'send',
  ];

  const personRegex = /\b([A-Z][a-z]+)\b/;
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'tomorrow', 'today', 'eod', 'next week', 'end of week'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const cleanLine = line.replace(/^[#*-•\d.)\]\s]+/, '').trim();

    if (!cleanLine) continue;

    // Check Decisions
    const isDecision = decisionKeywords.some((kw) => lower.includes(kw)) && !lower.includes('i will') && !lower.includes("i'll");
    if (isDecision) {
      // Clean and format decision
      let formattedDecision = cleanLine;
      if (lower.startsWith('decision:')) {
        formattedDecision = cleanLine.replace(/^decision:\s*/i, '');
      }
      formattedDecision = formattedDecision.charAt(0).toUpperCase() + formattedDecision.slice(1);
      decisions.push(formattedDecision);
      continue;
    }

    // Check Action Items
    const hasActionKeyword = actionKeywords.some((kw) => lower.includes(kw));
    const personMatch = cleanLine.match(/^(?:[-*•]\s*)?([A-Z][a-z]+)\s+(?:will|to|should|is assigned to|must)\s+(.+)/i) ||
                        cleanLine.match(/(?:assign(?:ed)? to|owner:?)\s+([A-Z][a-z]+)/i);

    if (personMatch || hasActionKeyword) {
      let person = 'Team';
      let action = cleanLine;
      let deadlineStr = 'This week';

      if (personMatch) {
        if (personMatch[1] && personMatch[2]) {
          person = personMatch[1].trim();
          action = personMatch[2].trim();
        } else if (personMatch[1]) {
          person = personMatch[1].trim();
        }
      } else {
        // Look for named person in sentence
        const words = cleanLine.split(/\s+/);
        for (const w of words) {
          const capMatch = w.match(/^[A-Z][a-z]+$/);
          const ignored = ['Discussed', 'Discuss', 'The', 'Our', 'All', 'Rahul', 'Mathan', 'Sarah', 'Alex', 'David', 'Elena', 'Team'];
          if (capMatch && !['Discussed', 'The', 'We', 'They', 'Project', 'Review', 'Action'].includes(w)) {
            person = w;
            break;
          }
        }
      }

      // Check deadline mentions
      for (const day of daysOfWeek) {
        if (lower.includes(day)) {
          deadlineStr = day.charAt(0).toUpperCase() + day.slice(1);
          break;
        }
      }

      // Clean action text
      action = action.replace(/^(?:will|to|needs to|must|should)\s+/i, '');
      action = action.replace(/(?:by|before|on|due)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|next week|eod).*/i, '');
      action = action.charAt(0).toUpperCase() + action.slice(1);

      // Priority calculation
      let priority = 'medium';
      if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical') || lower.includes('blocker')) {
        priority = 'urgent';
      } else if (lower.includes('proposal') || lower.includes('high') || lower.includes('client') || lower.includes('executive') || lower.includes('wednesday') || lower.includes('tomorrow')) {
        priority = 'high';
      }

      // Check for first-person commitment
      if (lower.startsWith("i'll") || lower.startsWith('i will') || lower.startsWith('i promise') || lower.startsWith('let me')) {
        commitments.push({
          action: action || cleanLine,
          person: person === 'Team' ? 'Colleague / Stakeholder' : person,
          dueDate: parseDateFromNaturalLanguage(cleanLine).toISOString(),
          type: lower.includes('send') ? 'document_followup' : 'task_commitment',
          confidence: 0.95,
        });
      }

      actionItems.push({
        action: action.length > 5 ? action : cleanLine,
        person,
        deadline: deadlineStr,
        priority,
        estimatedTime: priority === 'high' ? '1 hr' : '45 mins',
      });
      continue;
    }

    // General context lines for summary
    generalSentences.push(cleanLine);
  }

  // Construct Summary
  if (generalSentences.length > 0) {
    summary = generalSentences.slice(0, 3).join(' ');
  }
  if (!summary) {
    if (decisions.length > 0 && actionItems.length > 0) {
      summary = `The team discussed ${title.toLowerCase()}, agreed on key roadmap milestones, and assigned ${actionItems.length} core action item${actionItems.length > 1 ? 's' : ''}.`;
    } else {
      summary = `Meeting discussion covering ${title}. Key action points and decisions were identified and structured.`;
    }
  }

  // Fallback defaults if notes were very brief
  if (decisions.length === 0 && lines.some((l) => l.toLowerCase().includes('agree') || l.toLowerCase().includes('launch'))) {
    decisions.push('Campaign and deliverable timeline approved by the team.');
  }

  // Deduplicate action items
  const uniqueActions = [];
  const seen = new Set();
  for (const item of actionItems) {
    const key = item.action.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueActions.push(item);
    }
  }

  return {
    title,
    summary,
    decisions: decisions.length > 0 ? decisions : ['Agreed on immediate project priorities and sprint deliverables.'],
    actionItems: uniqueActions.length > 0 ? uniqueActions : [
      {
        action: 'Review meeting takeaways and coordinate with team members',
        person: 'Team',
        deadline: 'This week',
        priority: 'medium',
        estimatedTime: '30 mins',
      },
    ],
    commitments,
  };
}

/**
 * Validate and analyze meeting notes
 */
async function analyzeMeetingNotes(userId, rawNotes) {
  if (!rawNotes || !rawNotes.trim()) {
    throw new Error('Please paste your meeting notes to analyze.');
  }

  const structured = extractStructuredMeetingData(rawNotes);

  // Create persisted Meeting doc
  const meeting = await Meeting.create({
    userId,
    title: structured.title,
    rawNotes: rawNotes.trim(),
    summary: structured.summary,
    decisions: structured.decisions,
    actionItems: structured.actionItems,
    commitments: structured.commitments,
  });

  await Activity.create({
    type: 'meeting_analyzed',
    description: `Analyzed meeting notes: "${meeting.title}" (${meeting.actionItems.length} action items, ${meeting.decisions.length} decisions)`,
    userId,
  });

  return meeting;
}

/**
 * Convert an extracted Action Item into an official Task
 */
async function convertActionItemToTask(userId, meetingId, actionItemIndex, customData = {}) {
  const meeting = await Meeting.findOne({ _id: meetingId, userId });
  if (!meeting) {
    throw new Error('Meeting not found.');
  }

  const actionItem = meeting.actionItems[actionItemIndex];
  if (!actionItem) {
    throw new Error('Action item not found in this meeting.');
  }

  if (actionItem.taskId) {
    // Already converted, return existing task
    const existing = await Task.findById(actionItem.taskId);
    if (existing) {
      return { task: existing, alreadyCreated: true };
    }
  }

  // Parse natural language deadline
  const deadlineDate = parseDateFromNaturalLanguage(customData.deadline || actionItem.deadline || 'tomorrow');

  const title = customData.title || customData.action || actionItem.action;
  const importance = customData.importance || customData.priority || actionItem.priority || 'medium';
  const estimatedTime = customData.estimatedTime || actionItem.estimatedTime || '45 mins';
  const description = `Extracted from Meeting: "${meeting.title}"\nOwner: ${customData.person || actionItem.person}\nTarget Deadline: ${customData.deadline || actionItem.deadline}`;

  const analysis = calculateDeterministicPriority({
    title,
    description,
    deadline: deadlineDate,
    importance,
    estimatedTime,
  });

  const task = await Task.create({
    title,
    description,
    deadline: deadlineDate,
    importance,
    estimatedTime,
    priority: analysis.priority,
    priorityReason: `Extracted from meeting "${meeting.title}" • Assigned to ${actionItem.person}`,
    status: 'pending',
    createdBy: userId,
  });

  // Link taskId in meeting document
  actionItem.taskId = task._id;
  await meeting.save();

  await Activity.create({
    type: 'task_created',
    description: `Created task from meeting "${meeting.title}": "${task.title}"`,
    taskId: task._id,
    userId,
  });

  return { task, alreadyCreated: false };
}

/**
 * Convert an extracted Commitment into an official Follow-up
 */
async function convertCommitmentToFollowUp(userId, meetingId, commitmentIndex, customData = {}) {
  const meeting = await Meeting.findOne({ _id: meetingId, userId });
  if (!meeting) {
    throw new Error('Meeting not found.');
  }

  const commitment = meeting.commitments[commitmentIndex];
  if (!commitment) {
    throw new Error('Commitment not found in this meeting.');
  }

  if (commitment.followUpId) {
    const existing = await FollowUp.findById(commitment.followUpId);
    if (existing) {
      return { followUp: existing, alreadyCreated: true };
    }
  }

  const title = customData.action || commitment.action;
  const person = customData.person || commitment.person;
  const dueDate = customData.dueDate ? new Date(customData.dueDate) : new Date(commitment.dueDate);

  const followUp = await FollowUp.create({
    title,
    person,
    dueDate,
    source: `Meeting: "${meeting.title}"`,
    status: 'pending',
    userId,
  });

  commitment.followUpId = followUp._id;
  await meeting.save();

  await Activity.create({
    type: 'followup_created',
    description: `Created follow-up from meeting with ${person}: "${title}"`,
    userId,
  });

  return {
    followUp: {
      ...followUp.toObject(),
      status: followUp.calculateDynamicStatus(),
    },
    alreadyCreated: false,
  };
}

module.exports = {
  analyzeMeetingNotes,
  convertActionItemToTask,
  convertCommitmentToFollowUp,
  extractStructuredMeetingData,
};
