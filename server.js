const User = require('./database/user');
const bcrypt = require('bcrypt');
const session = require('express-session');
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const app = express();
const { connect, getDb } = require('./database/mongo');
const { ObjectId } = require('mongodb');
const validateTask = require('./middleware/validateTask');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());

app.use(
  session({
    name: 'sessionId',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,   // ОБЯЗАТЕЛЬНО
      secure: false,    // true будет на Render (HTTPS)
      maxAge: 1000 * 60 * 60 // 1 час
    }
  })
);

function isAuthenticated(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.session.user.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}

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

app.get('/admin', isAuthenticated, requireRole('admin'), (req, res) => {
  res.sendFile(__dirname + '/views/admin.html');
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

app.get('/api/check-auth', (req, res) => {
  if (req.session.userId) {
    return res.json({
      authenticated: true,
      username: req.session.username
    });
  }

  res.json({ authenticated: false });
});

app.get('/api/tasks', isAuthenticated, async (req, res) => {
  try {
    const db = getDb();
    const { title, page = 1, limit = 5 } = req.query;

    let filter = {};

    // 👤 Owner access
    if (req.session.user.role === "admin") {
      filter = {};
    } else {
      filter = { userId: new ObjectId(req.session.userId) };
    }

    // 🔍 Поиск по title
    if (title) {
      filter.title = { $regex: title, $options: "i" };
    }

    const skip = (page - 1) * limit;

    let pipeline = [
      { $match: filter },

      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project"
        }
      },

      {
        $unwind: {
          path: "$project",
          preserveNullAndEmptyArrays: true
        }
      },

      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) }
    ];

    const tasks = await db
      .collection("tasks")
      .aggregate(pipeline)
      .toArray();

    res.status(200).json(tasks);

  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get('/api/tasks/:id', isAuthenticated, async (req, res) => {
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

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashedPassword,
      role: "user"
    });

    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ error: "Invalid input format" });
    }

    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.userId = user._id;
    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role
    };

    res.json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/profile', isAuthenticated, (req, res) => {
  res.json({
    message: 'Protected route',
    userId: req.session.userId,
    username: req.session.username
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }

    res.clearCookie('sessionId');
    res.json({ message: 'Logged out' });
  });
});

app.get(
  '/api/admin/users',
  isAuthenticated,
  requireRole('admin'),
  async (req, res) => {
    try {
      const db = getDb();

      const users = await db
        .collection('users')
        .find({}, { projection: { password: 0 } }) // не показываем пароль
        .toArray();

      res.json(users);

    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  }
);

app.post('/api/projects', isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name required' });
    }

    if (!name) {
  return res.status(400).json({ error: "Project name required" });
}

if (name.length < 3) {
  return res.status(400).json({ error: "Project name too short" });
}

    const db = getDb();

    const newProject = {
      name,
      userId: new ObjectId(req.session.userId),
      createdAt: new Date()
    };

    const result = await db.collection('projects').insertOne(newProject);

    res.status(201).json({
      _id: result.insertedId,
      ...newProject
    });

  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/projects', isAuthenticated, async (req, res) => {
  try {
    const db = getDb();

    let filter = {};

    if (req.session.user.role !== "admin") {
      filter.userId = new ObjectId(req.session.userId);
    }

    const projects = await db.collection('projects').find(filter).toArray();

    res.json(projects);

  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/tasks', isAuthenticated, validateTask, async (req, res) => {
  try {
    const { title, description, dueDate, projectId } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description required" });
    }

    if (title.length < 3) {
      return res.status(400).json({ error: "Title too short" });
    }

    if (description.length < 3) {
      return res.status(400).json({ error: "Description too short" });
    }

    if (dueDate && isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ error: "Invalid due date" });
    }

    const db = getDb();

    const newTask = {
      title,
      description,
      status: "To Do",
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId: projectId ? new ObjectId(projectId) : null,
      userId: new ObjectId(req.session.userId),
      createdAt: new Date()
    };

    const result = await db.collection('tasks').insertOne(newTask);

    res.status(201).json({
      _id: result.insertedId,
      ...newTask
    });

  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.put('/api/tasks/:id', isAuthenticated, validateTask, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, dueDate } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const updateFields = {};

    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (status) updateFields.status = status;

    if (dueDate !== undefined) {
      updateFields.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (title && title.length < 3) {
  return res.status(400).json({ error: "Title too short" });
}

if (description && description.length < 3) {
  return res.status(400).json({ error: "Description too short" });
}

if (dueDate && isNaN(Date.parse(dueDate))) {
  return res.status(400).json({ error: "Invalid due date" });
}

    const db = getDb();

    const filter =
  req.session.user.role === "admin"
    ? { _id: new ObjectId(id) }
    : {
        _id: new ObjectId(id),
        userId: new ObjectId(req.session.userId)
      };

const result = await db.collection('tasks').findOneAndUpdate(
  filter,
  { $set: updateFields },
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

app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const db = getDb();

    const filter =
  req.session.user.role === "admin"
    ? { _id: new ObjectId(id) }
    : {
        _id: new ObjectId(id),
        userId: new ObjectId(req.session.userId)
      };

const result = await db.collection('tasks').deleteOne(filter);

if (result.deletedCount === 0) {
  return res.status(404).json({ error: 'Task not found' });
}

res.status(200).json({ message: 'Task deleted successfully' });


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

