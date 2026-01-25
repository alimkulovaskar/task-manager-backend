require('dotenv').config();
const express = require('express');
const fs = require('fs');
const app = express();
const { connect, getDb } = require('./database/mongo');
const { ObjectId } = require('mongodb');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/views/about.html');
});

app.get('/contact', (req, res) => {
  res.sendFile(__dirname + '/views/contact.html');
});

app.get('/search', (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).send('Search query is required');
  }

  res.send(`
    <h1>Search Page</h1>
    <p>You searched for: <strong>${query}</strong></p>
    <a href="/">Back to Home</a>
  `);
});

app.get('/item/:id', (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).send('Item ID is required');
  }

  res.send(`
    <h1>Item Page</h1>
    <p>Item ID: <strong>${id}</strong></p>
    <a href="/">Back to Home</a>
  `);
});

app.get('/api/info', (req, res) => {
  res.status(200).json({
    project: 'Task Manager',
    description: 'Backend project using Node.js and Express.js',
    author: 'Askar, Bexultan, Aruzhan'
  });
});

app.get('/api/tasks', async (req, res) => {
  try {
    const db = getDb();
    const { title, sort, fields, page = 1, limit = 5 } = req.query;

    const filter = {};
    if (title) {
      filter.title = { $regex: title, $options: 'i' };
    }

    let query = db.collection('tasks').find(filter);

    if (sort) {
      const sortOrder = sort === 'desc' ? -1 : 1;
      query = query.sort({ title: sortOrder });
    }

    if (fields) {
      const projection = {};
      fields.split(',').forEach(f => projection[f] = 1);
      query = query.project(projection);
    }

    const skip = (page - 1) * limit;
query = query.skip(parseInt(skip)).limit(parseInt(limit));

    const tasks = await query.toArray();
    res.status(200).json(tasks);

  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // validation: Mongo ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const db = getDb();
    const task = await db
      .collection('tasks')
      .findOne({ _id: new ObjectId(id) });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const db = getDb();

    const result = await db.collection('tasks').insertOne({
      title,
      description
    });

    res.status(201).json({
      _id: result.insertedId,
      title,
      description
    });

  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    // validate id
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    // validate body
    if (!title || !description) {
      return res.status(400).json({
        error: 'Title and description are required'
      });
    }

    const db = getDb();

    const result = await db.collection('tasks').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { title, description } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(result.value);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const db = getDb();

    const result = await db.collection('tasks').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  // Validation
  if (!name || !email || !message) {
    return res.status(400).send('All fields are required');
  }

  const contactData = {
    name,
    email,
    message,
    date: new Date().toISOString()
  };

  fs.writeFile(
    'contacts.json',
    JSON.stringify(contactData, null, 2),
    (err) => {
      if (err) {
        return res.status(500).send('Error saving data');
      }

      res.send(`
        <h2>Thank you, ${name}!</h2>
        <p>Your message has been saved.</p>
        <a href="/">Back to Home</a>
      `);
    }
  );
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connect();   // ждём подключение к Mongo
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB');
  }
}

startServer();

app.use((req, res) => {
  // API routes -> JSON
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'Route not found' });
  }

  // Normal pages -> HTML
  res.status(404).send(`
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <a href="/">Go back to Home</a>
  `);
});

