require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;

async function connect() {
  await client.connect();
  db = client.db();
  console.log('MongoDB connected');
}

function getDb() {
  return db;
}

module.exports = { connect, getDb };
