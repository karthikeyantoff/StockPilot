const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is missing in environment variables!');
  }

  if (!cachedConnection) {
    const opts = {
      bufferCommands: true,
      serverSelectionTimeoutMS: 5000,
    };
    cachedConnection = mongoose.connect(MONGO_URI, opts).then((m) => m);
  }

  try {
    await cachedConnection;
  } catch (err) {
    cachedConnection = null;
    throw err;
  }

  return mongoose.connection;
};

module.exports = connectDB;
