const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

const projectForm = document.getElementById('project-form');
const projectList = document.getElementById('project-list');
const projectSelect = document.getElementById('project-select');

async function loadProjects() {
  const res = await fetch('/api/projects');
  if (!res.ok) return;

  const projects = await res.json();

  projectList.innerHTML = '';
  projectSelect.innerHTML = '<option value="">No Project</option>';

  projects.forEach(project => {
    const li = document.createElement('li');
    li.textContent = project.name;
    projectList.appendChild(li);

    const option = document.createElement('option');
    option.value = project._id;
    option.textContent = project.name;
    projectSelect.appendChild(option);
  });
}

projectForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('project-name').value;

  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });

  if (res.ok) {
    projectForm.reset();
    loadProjects();
  }
});


/* ================= MODAL ================= */

function showLogin() {
  const modal = document.getElementById('auth-modal');
  const loginBox = document.getElementById('login-box');
  const registerBox = document.getElementById('register-box');

  if (!modal || !loginBox || !registerBox) return;

  modal.style.display = 'flex';
  loginBox.style.display = 'block';
  registerBox.style.display = 'none';
}

function showRegister() {
  const modal = document.getElementById('auth-modal');
  const loginBox = document.getElementById('login-box');
  const registerBox = document.getElementById('register-box');

  if (!modal || !loginBox || !registerBox) return;

  modal.style.display = 'flex';
  loginBox.style.display = 'none';
  registerBox.style.display = 'block';
}

function closeModal() {
  document.getElementById('auth-modal').style.display = 'none';
}

function goAdmin() {
  window.location.href = "/admin";
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

  sessionStorage.setItem("role", data.user.role);

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

  const hero = document.querySelector('.hero');
  const taskSection = document.getElementById('task-section');
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const logoutBtn = document.getElementById('logout-btn');

  if (data.authenticated) {
    isLoggedIn = true;

    if (hero) hero.style.display = 'none';
    if (taskSection) taskSection.style.display = 'block';

    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';

  } else {
    isLoggedIn = false;

    if (hero) hero.style.display = 'block';
    if (taskSection) taskSection.style.display = 'none';

    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (registerBtn) registerBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }

  if (taskSection) loadTasks();
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
  const adminBtn = document.getElementById('admin-btn');

  if (authenticated) {
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';

    if (sessionStorage.getItem("role") === "admin") {
      adminBtn.style.display = 'inline-block';
    }

  } else {
    loginBtn.style.display = 'inline-block';
    registerBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    adminBtn.style.display = 'none';
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
      ${task.project ? `<small>Project: ${task.project.name}</small>` : ""}
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

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const dueDate = document.getElementById('dueDate').value;
  const errorBox = document.getElementById('task-error');

  // 🔥 CLIENT VALIDATION
  if (title.length < 3) {
    errorBox.style.display = 'block';
    errorBox.innerText = "Title must be at least 3 characters.";
    return;
  }

  if (description.length < 3) {
    errorBox.style.display = 'block';
    errorBox.innerText = "Description must be at least 3 characters.";
    return;
  }

  errorBox.style.display = 'none';

  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, dueDate })
  });

  const data = await res.json();

  if (!res.ok) {
    errorBox.style.display = 'block';
    errorBox.innerText = data.error;
    return;
  }

  taskForm.reset();
  loadTasks();
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
loadProjects();


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

async function loadUsers() {
  const res = await fetch('/api/admin/users');
  if (!res.ok) return;

  const users = await res.json();
  const list = document.getElementById('users-list');
  if (!list) return;

  list.innerHTML = '';

  users.forEach(user => {
    const li = document.createElement('li');
    li.classList.add("task-item");
    li.innerHTML = `
      <strong>${user.username}</strong>
      <span class="badge">${user.role}</span>
    `;
    list.appendChild(li);
  });
}
