/**
 * Follow-up & Commitment Detection Engine
 * Extracts structured action commitments, counterparty persons, and due dates from text.
 */

function parseDateFromNaturalLanguage(text) {
  const lower = text.toLowerCase();
  const now = new Date();
  const target = new Date(now);

  if (lower.includes('today') || lower.includes('eod') || lower.includes('end of day')) {
    target.setHours(18, 0, 0, 0);
    return target;
  }

  if (lower.includes('tomorrow')) {
    target.setDate(target.getDate() + 1);
    target.setHours(17, 0, 0, 0);
    return target;
  }

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < daysOfWeek.length; i++) {
    if (lower.includes(daysOfWeek[i])) {
      const currentDay = now.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7; // Next occurrence
      target.setDate(target.getDate() + diff);
      target.setHours(17, 0, 0, 0);
      return target;
    }
  }

  if (lower.includes('next week')) {
    target.setDate(target.getDate() + 7);
    target.setHours(17, 0, 0, 0);
    return target;
  }

  if (lower.includes('in 2 days') || lower.includes('two days')) {
    target.setDate(target.getDate() + 2);
    target.setHours(17, 0, 0, 0);
    return target;
  }

  // Default to tomorrow 5pm
  target.setDate(target.getDate() + 1);
  target.setHours(17, 0, 0, 0);
  return target;
}

function extractDeterministicCommitment(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Extract person/entity
  let person = 'Team';
  const personPatterns = [
    /(?:to|with|for|email|ping|call|message|ask)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /(?:to|with|for|email|ping|call|message|ask)\s+([a-zA-Z]+)/i,
  ];

  for (const pattern of personPatterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const ignoredWords = ['the', 'my', 'a', 'an', 'our', 'his', 'her', 'their', 'tomorrow', 'today', 'friday', 'monday', 'next', 'review', 'send', 'share'];
      if (!ignoredWords.includes(candidate.toLowerCase())) {
        person = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        break;
      }
    }
  }

  // Extract action
  let action = clean;
  // Remove "I'll", "I will", "Need to", "Promise to"
  action = action.replace(/^(?:i'll|i will|let me|we need to|need to|promise to|i must|i have to)\s+/i, '');
  // Capitalize first letter
  action = action.charAt(0).toUpperCase() + action.slice(1);

  // Truncate if excessively long
  if (action.length > 80) {
    action = action.substring(0, 77) + '...';
  }

  const dueDate = parseDateFromNaturalLanguage(clean);

  // Type classification
  let type = 'task_commitment';
  if (lower.includes('send') || lower.includes('share') || lower.includes('proposal') || lower.includes('report') || lower.includes('document') || lower.includes('deck')) {
    type = 'document_followup';
  } else if (lower.includes('call') || lower.includes('meeting') || lower.includes('sync') || lower.includes('zoom') || lower.includes('catch up')) {
    type = 'meeting_followup';
  } else if (lower.includes('email') || lower.includes('reply') || lower.includes('write back')) {
    type = 'email_followup';
  }

  return {
    action: action || 'Follow up with stakeholder',
    person: person || 'Stakeholder',
    dueDate: dueDate.toISOString(),
    type,
    confidence: 0.92,
  };
}

module.exports = {
  extractDeterministicCommitment,
  parseDateFromNaturalLanguage,
};
