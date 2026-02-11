const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

/* ================= MODAL ================= */

function showLogin() {
  document.getElementById('auth-modal').style.display = 'flex';
  document.getElementById('login-box').style.display = 'block';
  document.getElementById('register-box').style.display = 'none';
}

function showRegister() {
  document.getElementById('auth-modal').style.display = 'flex';
  document.getElementById('login-box').style.display = 'none';
  document.getElementById('register-box').style.display = 'block';
}

function closeModal() {
  document.getElementById('auth-modal').style.display = 'none';
}

/* ================= REGISTER ================= */

async function register() {
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;

  const res = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    document.getElementById('register-message').innerText =
      'Registration successful. Please login.';
  } else {
    document.getElementById('register-message').innerText = data.error;
  }
}

/* ================= LOGIN ================= */

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
    closeModal();
    showApp();
  } else {
    document.getElementById('login-message').innerText = data.error;
  }
}

/* ================= LOGOUT ================= */

async function logout() {
  await fetch('/logout', { method: 'POST' });

  isLoggedIn = false;

  // показать hero обратно
  document.querySelector('.hero').style.display = 'block';

  // скрыть task section
  document.getElementById('task-section').style.display = 'none';

  // показать login / register кнопки
  document.getElementById('login-btn').style.display = 'inline-block';
  document.getElementById('register-btn').style.display = 'inline-block';

  // скрыть logout кнопку
  document.getElementById('logout-btn').style.display = 'none';

  // перезагрузить задачи (чтобы удалить кнопки delete/update)
  loadTasks();
}

/* ================= CHECK AUTH ================= */

async function checkAuth() {
  const res = await fetch('/api/check-auth');
  const data = await res.json();

  if (data.authenticated) {
    isLoggedIn = true;

    document.querySelector('.hero').style.display = 'none';
    document.getElementById('task-section').style.display = 'block';

    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('register-btn').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'inline-block';

  } else {
    isLoggedIn = false;

    document.querySelector('.hero').style.display = 'block';
    document.getElementById('task-section').style.display = 'none';

    document.getElementById('login-btn').style.display = 'inline-block';
    document.getElementById('register-btn').style.display = 'inline-block';
    document.getElementById('logout-btn').style.display = 'none';
  }

  loadTasks();
}

/* ================= UI STATES ================= */

function showApp() {
  document.querySelector('.hero').style.display = 'none';
  document.getElementById('task-section').style.display = 'block';
  updateNavbar(true);
  loadTasks();
}

function showGuest() {
  document.getElementById('task-section').style.display = 'none';
  updateNavbar(false);
}

function updateNavbar(authenticated) {
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const logoutBtn = document.getElementById('logout-btn');

  if (authenticated) {
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
  } else {
    loginBtn.style.display = 'inline-block';
    registerBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
  }
}

/* ================= LOAD TASKS ================= */

async function loadTasks() {
  const res = await fetch('/api/tasks');
  if (!res.ok) return;

  const tasks = await res.json();
  const filter = document.getElementById('status-filter')?.value || "All";

  taskList.innerHTML = '';

  tasks
    .filter(task => {
  if (!task.status) task.status = "To Do";
  return filter === "All" || task.status === filter;
})
    .forEach(task => {

  const li = document.createElement('li');

  const today = new Date();
  today.setHours(0,0,0,0);

  let deadlineClass = "";

  if (task.dueDate) {
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0,0,0,0);

    if (taskDate < today) {
      deadlineClass = "overdue";
    } else if (taskDate.getTime() === today.getTime()) {
      deadlineClass = "today";
    }
  }

  li.classList.add("task-item", task.status.replace(" ", "-"));

  if (deadlineClass) {
    li.classList.add(deadlineClass);
  }

  li.innerHTML = `
    <div class="task-content">
      <strong>${task.title}</strong>
      <p>${task.description}</p>
      ${task.dueDate ? `<small>Due: ${new Date(task.dueDate).toLocaleDateString()}</small>` : ""}
      <span class="badge">${task.status}</span>
    </div>

    <div class="task-actions">
      <select onchange="changeStatus('${task._id}', this.value)">
        <option ${task.status==="To Do"?"selected":""}>To Do</option>
        <option ${task.status==="In Progress"?"selected":""}>In Progress</option>
        <option ${task.status==="Done"?"selected":""}>Done</option>
      </select>
      <button onclick="deleteTask('${task._id}')">Delete</button>
    </div>
  `;

  taskList.appendChild(li);
});
}

/* ================= CREATE ================= */

taskForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const dueDate = document.getElementById('dueDate').value;


  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, dueDate })
  });

  if (res.ok) {
    taskForm.reset();
    loadTasks();
  }
});

/* ================= CHANGE STATUS ================= */

async function changeStatus(id, newStatus) {
  await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  });

  loadTasks();
}

/* ================= DELETE ================= */

async function deleteTask(id) {
  await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  loadTasks();
}

/* ================= UPDATE ================= */

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

/* ================= INITIAL ================= */

checkAuth();

/* ================= THEME ================= */

function toggleTheme() {
  document.body.classList.toggle('dark');

  const isDark = document.body.classList.contains('dark');

  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  document.getElementById('theme-toggle').innerText =
    isDark ? '☀️' : '🌙';
}

function loadTheme() {
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    document.getElementById('theme-toggle').innerText = '☀️';
  }
}

loadTheme();
