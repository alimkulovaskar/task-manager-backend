const { ObjectId } = require('mongodb');
const { getDb } = require('./mongo');

class User {
  static async create({ username, password }) {
    const db = getDb();
    return db.collection('users').insertOne({
      username,
      password,
      createdAt: new Date()
    });
  }

  static async findByUsername(username) {
    const db = getDb();
    return db.collection('users').findOne({ username });
  }

  static async findById(id) {
    const db = getDb();
    return db
      .collection('users')
      .findOne({ _id: new ObjectId(id) });
  }
}

module.exports = User;
