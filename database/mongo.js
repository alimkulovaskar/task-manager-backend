const { MongoClient } = require('mongodb');

let db;

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  const client = new MongoClient(uri);
  await client.connect();
  db = client.db("taskmanager");
  console.log('MongoDB connected');
}

function getDb() {
  return db;
}

module.exports = { connect, getDb };
