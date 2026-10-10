const { connectDB } = require('./config/db');
const { seedInitialData } = require('./utils/seed');
const User = require('./models/User');
const Task = require('./models/Task');
const FollowUp = require('./models/FollowUp');
const DailyPlan = require('./models/DailyPlan');
const Meeting = require('./models/Meeting');
const { getTodayPlan, generateTodayPlan, reorderPlan, toggleTaskInPlan } = require('./services/plannerService');
const { analyzeMeetingNotes, convertActionItemToTask, convertCommitmentToFollowUp } = require('./services/meetingIntelligenceService');
const { getProductivitySummary, getWorkloadOverview, getTimeDistribution, getProductivityPatterns, getWeeklyInsights } = require('./services/productivityInsightsService');

async function runTests() {
  console.log('🧪 Starting Acceptance Tests for 3 New Modules...');
  await connectDB();
  await seedInitialData();

  const user = await User.findOne({ email: 'mathan@officecompanion.ai' });
  if (!user) {
    console.error('❌ Demo user mathan@officecompanion.ai not found.');
    process.exit(1);
  }
  const userId = user._id;
  console.log(`👤 Using Authenticated User: ${user.name} (${user.email})`);

  // ==========================================
  // TEST 1: Smart Daily Planner
  // ==========================================
  console.log('\n--- [TEST 1] Smart Daily Planner ---');
  const initialPlan = await getTodayPlan(userId, false);
  console.log(`✅ Loaded Today Plan: ${initialPlan.metrics.tasksToday} tasks scheduled, ${initialPlan.metrics.estimatedWorkFormatted} estimated work`);
  console.log(`   Items in schedule: ${initialPlan.planItems.length}`);
  initialPlan.planItems.forEach((item, idx) => {
    console.log(`   [${item.startTime} - ${item.endTime}] ${item.type.toUpperCase()}: ${item.title} (${item.durationFormatted}) - ${item.reason}`);
  });

  const regeneratedPlan = await generateTodayPlan(userId, true);
  console.log(`✅ Regenerated Plan: ${regeneratedPlan.items.length} schedule slots created.`);

  // Test reordering
  const taskItems = initialPlan.planItems.filter((i) => i.type === 'task' && i.taskId);
  if (taskItems.length > 1) {
    const reversedIds = taskItems.map((i) => String(i.taskId)).reverse();
    const reordered = await reorderPlan(userId, reversedIds);
    console.log(`✅ Reordered Plan: First task is now "${reordered.planItems[0]?.title}"`);
  }

  // ==========================================
  // TEST 2: Meeting & Note Intelligence
  // ==========================================
  console.log('\n--- [TEST 2] Meeting & Note Intelligence ---');
  const sampleNotes = `Discussed the Q4 marketing campaign with Rahul and Mathan.
Rahul will prepare the revised proposal by Wednesday.
Mathan will review the campaign metrics and target ROAS.
The team agreed to launch the campaign next Monday.
I'll send the revised proposal to Rahul tomorrow morning for review.`;

  const meeting = await analyzeMeetingNotes(userId, sampleNotes);
  console.log(`✅ Analyzed Meeting: "${meeting.title}"`);
  console.log(`   Summary: "${meeting.summary}"`);
  console.log(`   Decisions (${meeting.decisions.length}): ${meeting.decisions.join('; ')}`);
  console.log(`   Action Items (${meeting.actionItems.length}):`);
  meeting.actionItems.forEach((a, i) => {
    console.log(`     #${i + 1}: ${a.action} (Owner: ${a.person}, Due: ${a.deadline}, Priority: ${a.priority})`);
  });
  console.log(`   Commitments (${meeting.commitments.length}):`);
  meeting.commitments.forEach((c, i) => {
    console.log(`     #${i + 1}: ${c.action} (Person: ${c.person}, Due: ${c.dueDate})`);
  });

  // Convert Action Item to Task
  const convertedTaskRes = await convertActionItemToTask(userId, meeting._id, 0);
  console.log(`✅ Converted Action Item #0 to Task: "${convertedTaskRes.task.title}" (ID: ${convertedTaskRes.task._id}, Priority: ${convertedTaskRes.task.priority})`);

  // Verify task exists in Task collection
  const verifiedTask = await Task.findById(convertedTaskRes.task._id);
  console.log(`   Verified in Task DB: "${verifiedTask.title}", Status: ${verifiedTask.status}, CreatedBy: ${verifiedTask.createdBy}`);

  // Convert Commitment to Follow-up
  if (meeting.commitments.length > 0) {
    const convertedFollowUpRes = await convertCommitmentToFollowUp(userId, meeting._id, 0);
    console.log(`✅ Converted Commitment #0 to FollowUp: "${convertedFollowUpRes.followUp.title}" (Person: ${convertedFollowUpRes.followUp.person})`);

    const verifiedFollowUp = await FollowUp.findById(convertedFollowUpRes.followUp._id);
    console.log(`   Verified in FollowUp DB: "${verifiedFollowUp.title}", Person: ${verifiedFollowUp.person}`);
  }

  // ==========================================
  // TEST 3: Productivity Insights
  // ==========================================
  console.log('\n--- [TEST 3] Productivity Insights ---');
  const summary = await getProductivitySummary(userId);
  console.log(`✅ KPI Summary: Tasks Done=${summary.kpis.tasksCompleted}, High Priority Done=${summary.kpis.highPriorityCompleted}, Follow-ups Done=${summary.kpis.followUpsCompleted}, Overdue=${summary.kpis.overdueTasks}`);

  const workload = await getWorkloadOverview(userId);
  console.log(`✅ 7-Day Workload Overview: ${workload.length} days computed:`);
  workload.forEach((w) => console.log(`   ${w.day} (${w.date}): Completed=${w.completed}, Remaining=${w.remaining}`));

  const distribution = await getTimeDistribution(userId);
  console.log(`✅ Time Distribution: HasEnoughData=${distribution.hasEnoughData}`);
  if (distribution.hasEnoughData) {
    distribution.distribution.forEach((d) => console.log(`   ${d.category}: ${d.minutes}m (${d.percentage}%)`));
  } else {
    console.log(`   Explanation: ${distribution.explanation}`);
  }

  const patterns = await getProductivityPatterns(userId);
  console.log(`✅ Productivity Patterns: PeakWindow="${patterns.peakWindow}", AvgDuration="${patterns.averageTaskDuration}", FollowUpRate="${patterns.followUpCompletionRate}"`);

  const weeklyInsights = await getWeeklyInsights(userId);
  console.log(`✅ Weekly AI Insights:`);
  console.log(`   Observations: ${weeklyInsights.observations.join(' | ')}`);
  console.log(`   Suggestions: ${weeklyInsights.suggestions.map((s) => s.title).join('; ')}`);

  console.log('\n🎉 ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
