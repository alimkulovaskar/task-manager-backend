let isLoggedIn = false;

const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

// ===== LOGIN =====
async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    isLoggedIn = true;

    document.getElementById('login-message').innerText = 'Logged in';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('task-section').style.display = 'block';

    loadTasks();
  } else {
    document.getElementById('login-message').innerText = data.error;
  }
}

// ===== LOAD TASKS =====
async function loadTasks() {
  const res = await fetch('/api/tasks');
  const tasks = await res.json();

  taskList.innerHTML = '';

  tasks.forEach(task => {
    const li = document.createElement('li');

    li.innerHTML = `<strong>${task.title}</strong>: ${task.description}`;

    if (isLoggedIn) {
      li.innerHTML += `
        <button onclick="deleteTask('${task._id}')">Delete</button>
        <button onclick="updateTask('${task._id}')">Update</button>
      `;
    }

    taskList.appendChild(li);
  });
}

// ===== CREATE TASK =====
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;

  await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description })
  });

  taskForm.reset();
  loadTasks();
});

// ===== DELETE TASK =====
async function deleteTask(id) {
  await fetch(`/api/tasks/${id}`, {
    method: 'DELETE'
  });
  loadTasks();
}

// ===== UPDATE TASK =====
async function updateTask(id) {
  const title = prompt('New title');
  const description = prompt('New description');

  if (!title || !description) return;

  await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description })
  });

  loadTasks();
}

// ===== INITIAL STATE =====
document.getElementById('task-section').style.display = 'none';
loadTasks();
