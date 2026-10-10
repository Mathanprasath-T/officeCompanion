const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const Task = require('./models/Task');
const FollowUp = require('./models/FollowUp');
const Meeting = require('./models/Meeting');

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  await connectDB();
  console.log('====================================================');
  console.log('🧪 Starting OfficeCompanion Production Auth Verification');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    // 1. Check API Health
    console.log('1️⃣ Checking API Health...');
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'healthy', 'API Server is healthy and running');

    // Generate unique test emails for User A and User B
    const timestamp = Date.now();
    const googleUserA = {
      email: `google.user.a.${timestamp}@example.com`,
      name: 'Google User A',
      googleId: `gid_a_${timestamp}`,
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    };

    const googleUserB = {
      email: `google.user.b.${timestamp}@example.com`,
      name: 'Google User B',
      googleId: `gid_b_${timestamp}`,
      picture: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120',
    };

    // 2. Test First-Time Google Login (User A Creation in MongoDB)
    console.log('\n2️⃣ Testing First-time Google Login & MongoDB Persistence (User A)...');
    const googleLoginResA = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleUserA),
    });
    const googleDataA = await googleLoginResA.json();
    if (!googleLoginResA.ok) {
      console.log('Google Auth Error Response:', googleDataA);
    }
    assert(googleLoginResA.status === 200, 'Google login HTTP status is 200 OK');
    assert(!!googleDataA.token, 'Google login returned a valid JWT session token');
    assert(googleDataA.user && googleDataA.user.email === googleUserA.email, `User A email correctly matched`);
    assert(googleDataA.user && googleDataA.user.authProvider === 'google', 'User A authProvider is set to google');

    const tokenA = googleDataA.token;
    const userAId = googleDataA.user.id;

    // 3. Test Repeated Google Login (Deduplication Check)
    console.log('\n3️⃣ Testing Repeated Google Login with Same Account (Deduplication)...');
    const repeatLoginResA = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleUserA),
    });
    const repeatDataA = await repeatLoginResA.json();
    assert(repeatLoginResA.status === 200, 'Repeat Google login succeeded');
    assert(repeatDataA.user.id === userAId, 'User ID is identical on repeat login (no duplicate document created)');

    // 4. Test Session Persistence (/api/auth/me)
    console.log('\n4️⃣ Testing Session Verification (/api/auth/me)...');
    const meResA = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const meDataA = await meResA.json();
    assert(meResA.status === 200, '/api/auth/me returned 200 with valid session token');
    assert(meDataA.user.email === googleUserA.email, 'Session user matches logged-in Google user');

    // 5. Test Unauthenticated Request Protection
    console.log('\n5️⃣ Testing Protected Route Rejection (Without Token)...');
    const unauthRes = await fetch(`${API_BASE}/tasks`);
    assert(unauthRes.status === 401, 'Protected /api/tasks rejected unauthenticated request with 401');

    // 6. Test User A Creating Data (Tasks, Follow-ups, Meetings)
    console.log('\n6️⃣ Testing User A Creating Data...');
    const createTaskResA = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'User A Secret Q4 Budget Plan',
        description: 'Prepare executive budget breakdown for Q4',
        importance: 'urgent',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        estimatedTime: '60 mins',
      }),
    });
    const taskDataA = await createTaskResA.json();
    if (!createTaskResA.ok) {
      console.log('Create Task Error:', taskDataA);
    }
    assert(createTaskResA.status === 201, 'User A created a new task successfully');
    const taskAId = taskDataA.data._id;

    const createFollowUpResA = await fetch(`${API_BASE}/followups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Confirm signing with Client Alpha',
        person: 'Chief Operating Officer',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
    assert(createFollowUpResA.status === 201, 'User A created a follow-up successfully');

    // Verify User A can fetch their 1 task
    const tasksResA = await fetch(`${API_BASE}/tasks`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const tasksDataA = await tasksResA.json();
    assert(tasksDataA.data.length === 1, `User A sees exactly 1 task (found ${tasksDataA.data.length})`);

    // 7. Test User B Logging in via Google (Separate Account)
    console.log('\n7️⃣ Testing User B Logging In & User Data Isolation...');
    const googleLoginResB = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleUserB),
    });
    const googleDataB = await googleLoginResB.json();
    assert(googleLoginResB.status === 200, 'User B signed in successfully');
    const tokenB = googleDataB.token;

    // Verify User B sees a clean EMPTY state (0 tasks, 0 follow-ups)
    const tasksResB = await fetch(`${API_BASE}/tasks`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const tasksDataB = await tasksResB.json();
    assert(tasksDataB.data.length === 0, `User B sees 0 tasks (CLEAN EMPTY STATE, found ${tasksDataB.data.length})`);

    const followupsResB = await fetch(`${API_BASE}/followups`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const followupsDataB = await followupsResB.json();
    assert(followupsDataB.data.length === 0, `User B sees 0 follow-ups (CLEAN EMPTY STATE, found ${followupsDataB.data.length})`);

    // Verify User B cannot access User A's task by ID
    const getTaskBAttempt = await fetch(`${API_BASE}/tasks/${taskAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(getTaskBAttempt.status === 404, `User B cannot access User A's task by ID (Status 404 Not Found)`);

    // 8. Test AI Recommendation Isolation
    console.log('\n8️⃣ Testing AI Feature Isolation...');
    const aiResB = await fetch(`${API_BASE}/ai/recommendation`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const aiDataB = await aiResB.json();
    assert(aiDataB.data === null, 'User B AI recommendation correctly returns null (no tasks to prioritize)');

    const aiResA = await fetch(`${API_BASE}/ai/recommendation`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const aiDataA = await aiResA.json();
    assert(aiDataA.data !== null && aiDataA.data.task.title === 'User A Secret Q4 Budget Plan', 'User A AI recommendation correctly operates on User A tasks');

    // 9. Clean up test users
    console.log('\n9️⃣ Cleaning up test records...');
    await Task.deleteMany({ createdBy: { $in: [userAId, googleDataB.user.id] } });
    await FollowUp.deleteMany({ userId: { $in: [userAId, googleDataB.user.id] } });
    await User.deleteMany({ _id: { $in: [userAId, googleDataB.user.id] } });
    console.log('  🧹 Cleaned up test database records.');

    console.log('\n====================================================');
    console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  }
}

runTests();
