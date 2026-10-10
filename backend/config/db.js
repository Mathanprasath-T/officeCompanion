const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI?.trim();

  // If a remote/custom URI is provided and is NOT local 127.0.0.1/localhost
  if (mongoUri && !mongoUri.includes('127.0.0.1') && !mongoUri.includes('localhost')) {
    try {
      console.log('📡 Connecting to external/Atlas MongoDB URI...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log('✅ Connected to MongoDB Atlas successfully.');
      return;
    } catch (err) {
      console.error('❌ Failed to connect to external MongoDB:', err.message);
      process.exit(1);
    }
  }

  // If local URI or no URI, attempt local MongoDB server first
  try {
    console.log('🔍 Checking local MongoDB server at 127.0.0.1:27017...');
    await mongoose.connect('mongodb://127.0.0.1:27017/officecompanion', {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('✅ Connected to local MongoDB server instance.');
    return;
  } catch (localErr) {
    console.log('ℹ️ Local MongoDB server not detected on port 27017.');
    console.log('⚡ Initializing embedded in-memory MongoDB engine...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          port: 27017, // try binding to default port so Compass can connect if available
        },
      });
      const inMemoryUri = mongodInstance.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`✅ Embedded MongoDB is running and connected at ${inMemoryUri}`);
    } catch (memErr) {
      // If port 27017 was busy or memory server default
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const inMemoryUri = mongodInstance.getUri();
        await mongoose.connect(inMemoryUri);
        console.log(`✅ Embedded MongoDB is running and connected at ${inMemoryUri}`);
      } catch (finalErr) {
        console.error('❌ Could not start in-memory MongoDB:', finalErr.message);
        console.log('👉 Please install MongoDB Community Server or use MongoDB Atlas (Cloud).');
        process.exit(1);
      }
    }
  }
};

module.exports = { connectDB };
