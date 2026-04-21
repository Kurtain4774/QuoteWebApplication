const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongo;

module.exports.startMemoryDb = async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
  process.env.NODE_ENV = 'test';
  process.env.CORS_ORIGIN = '*';
  await mongoose.connect(mongo.getUri());
};

module.exports.stopMemoryDb = async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
};

module.exports.clearDb = async () => {
  const collections = mongoose.connection.collections;
  for (const name in collections) {
    await collections[name].deleteMany({});
  }
};
