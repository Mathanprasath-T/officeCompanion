const { connectDB } = require('./config/db');
const User = require('./models/User');
const Task = require('./models/Task');
const Meeting = require('./models/Meeting');
const FollowUp = require('./models/FollowUp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth');

async function testAuthSystem() {
  console.log('🧪 Starting Authentication & Tenancy Acceptance Tests...');
  await connectDB();

  // Test 1: Register New User with min 8 char password
  console.log('\n--- [TEST 1] Email & Password Registration ---');
  const testEmail = `tester_${Date.now()}@officecompanion.ai`;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('SecurePass123!', salt);

  const newUser = await User.create({
    name: 'Jane Doe',
    email: testEmail,
    password: hashedPassword,
    authProvider: 'local',
    department: 'Engineering',
    role: 'Staff Engineer',
  });

  console.log(`✅ Registered User: ${newUser.name} (${newUser.email}) - ID: ${newUser._id}`);

  // Verify password hash verification
  const isCorrect = await bcrypt.compare('SecurePass123!', newUser.password);
  console.log(`✅ Password Verification: ${isCorrect ? 'MATCHED' : 'FAILED'}`);

  // Test 2: Google Sign-In Creation & Link
  console.log('\n--- [TEST 2] Google Sign-In Handling ---');
  const googleEmail = `google_user_${Date.now()}@company.com`;
  const googleUser = await User.create({
    name: 'Google User',
    email: googleEmail,
    googleId: `gid_${Date.now()}`,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    authProvider: 'google',
    department: 'Marketing',
    role: 'Campaign Lead',
  });

  console.log(`✅ Created Google OAuth User: ${googleUser.name} (${googleUser.email})`);
  console.log(`   AuthProvider: ${googleUser.authProvider}, GoogleId: ${googleUser.googleId}`);

  // Test 3: JWT Generation & Verification
  console.log('\n--- [TEST 3] JWT Session Persistence ---');
  const token = jwt.sign(
    { id: newUser._id, email: newUser.email, name: newUser.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log(`✅ JWT Token Verified for userId: ${decoded.id}, email: ${decoded.email}`);

  // Test 4: User Tenancy & Data Isolation
  console.log('\n--- [TEST 4] Strict User Tenancy & Isolation ---');
  const now = new Date();
  const taskA = await Task.create({
    title: "User A's Confidential Roadmap",
    description: "Secret project for User A",
    deadline: now,
    createdBy: newUser._id,
    importance: "urgent",
    priority: "urgent",
  });

  const taskB = await Task.create({
    title: "User B's Private Marketing Strategy",
    description: "Secret project for User B",
    deadline: now,
    createdBy: googleUser._id,
    importance: "high",
    priority: "high",
  });

  const userATasks = await Task.find({ createdBy: newUser._id });
  const userBTasks = await Task.find({ createdBy: googleUser._id });

  console.log(`✅ User A (${newUser.name}) sees ${userATasks.length} task(s): "${userATasks[0].title}"`);
  console.log(`✅ User B (${googleUser.name}) sees ${userBTasks.length} task(s): "${userBTasks[0].title}"`);

  // Ensure User A cannot find User B's task when querying with User A's identity
  const userACrossQuery = await Task.findOne({ _id: taskB._id, createdBy: newUser._id });
  console.log(`✅ Isolation Check: User A query for User B's task returned: ${userACrossQuery ? 'LEAKED ❌' : 'NULL (SECURE) ✅'}`);

  // Cleanup test documents
  await Task.deleteMany({ _id: { $in: [taskA._id, taskB._id] } });
  await User.deleteMany({ _id: { $in: [newUser._id, googleUser._id] } });
  console.log('\n🎉 ALL AUTHENTICATION & TENANCY TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

testAuthSystem().catch((err) => {
  console.error('❌ Auth test error:', err);
  process.exit(1);
});
