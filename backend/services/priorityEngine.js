/**
 * Priority Engine for OfficeCompanion
 * Calculates priority scores, assigns urgency tags, and generates human-understandable "Why this task?" explanations.
 */

function calculateDeterministicPriority(task) {
  const now = new Date();
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const importance = (task.importance || 'medium').toLowerCase();
  const title = (task.title || '').toLowerCase();
  const description = (task.description || '').toLowerCase();
  const estimatedTime = task.estimatedTime || '45 mins';

  let score = 50; // Base score
  const reasons = [];

  if (deadline) {
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
      score += 40;
      reasons.push('Overdue task requiring immediate attention');
    } else if (diffHours <= 24) {
      score += 30;
      reasons.push('Due today');
    } else if (diffHours <= 72) {
      score += 15;
      reasons.push('Due within 3 days');
    } else {
      score -= 5;
      reasons.push('Upcoming deadline');
    }
  }

  // Importance weighting
  if (importance === 'urgent') {
    score += 30;
    reasons.push('Marked as urgent priority');
  } else if (importance === 'high') {
    score += 20;
    reasons.push('High business impact');
  } else if (importance === 'medium') {
    score += 5;
  } else if (importance === 'low') {
    score -= 10;
  }

  // Contextual keywords in title & description
  if (
    title.includes('client') ||
    description.includes('client') ||
    title.includes('customer') ||
    title.includes('executive') ||
    title.includes('board') ||
    title.includes('ceo')
  ) {
    score += 15;
    reasons.push('Client or leadership dependency');
  }

  if (
    title.includes('review') ||
    title.includes('approval') ||
    title.includes('blocker') ||
    title.includes('bug')
  ) {
    score += 10;
    reasons.push('Unblocks team progress');
  }

  // Quick win calculation
  if (
    estimatedTime.includes('15') ||
    estimatedTime.includes('30') ||
    estimatedTime.includes('45') ||
    estimatedTime.includes('min')
  ) {
    reasons.push(`Fast execution (~${estimatedTime})`);
  }

  // Determine final priority tier
  let priority = 'medium';
  if (score >= 80) {
    priority = 'urgent';
  } else if (score >= 65) {
    priority = 'high';
  } else if (score >= 45) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  const primaryReason = reasons.slice(0, 3).join(' • ') || 'Standard scheduled work item.';

  return {
    priority,
    score,
    reason: primaryReason,
    recommended: score >= 65,
    estimatedEffort: estimatedTime,
  };
}

module.exports = {
  calculateDeterministicPriority,
};
