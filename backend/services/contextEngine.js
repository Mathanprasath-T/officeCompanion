/**
 * Context Recovery Engine for OfficeCompanion
 * Manages work session checkpoints, active work snapshots, and step resumption.
 */

function generateDefaultChecklist(taskTitle, taskDescription) {
  const title = (taskTitle || '').toLowerCase();
  
  if (title.includes('report') || title.includes('sales') || title.includes('quarterly')) {
    return {
      completedActions: ['Sales metrics collected', 'Data tables & revenue charts imported'],
      remainingActions: ['Draft executive summary commentary', 'Review final numbers with finance'],
      nextAction: 'Draft executive summary commentary',
      currentContext: 'Working on Section 3: Revenue variance across product lines.',
    };
  }

  if (title.includes('proposal') || title.includes('client') || title.includes('pitch')) {
    return {
      completedActions: ['Pricing model defined', 'Scope of work agreed in draft'],
      remainingActions: ['Format final PDF deliverable', 'Send approval email to stakeholder'],
      nextAction: 'Format final PDF deliverable',
      currentContext: 'Drafting pricing appendix and SLA terms.',
    };
  }

  if (title.includes('design') || title.includes('ui') || title.includes('ux')) {
    return {
      completedActions: ['Wireframes reviewed', 'Component token specs updated'],
      remainingActions: ['Design responsive mobile states', 'Export Figma assets for frontend'],
      nextAction: 'Design responsive mobile states',
      currentContext: 'Finalizing interactive states for dashboard cards.',
    };
  }

  return {
    completedActions: ['Initial review completed', 'Task requirements mapped'],
    remainingActions: ['Execute core deliverables', 'Final review & quality check'],
    nextAction: 'Execute core deliverables',
    currentContext: 'In progress. Ready to continue execution.',
  };
}

module.exports = {
  generateDefaultChecklist,
};
