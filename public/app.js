const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

async function loadTasks() {
  const res = await fetch('/api/tasks');
  const tasks = await res.json();

  taskList.innerHTML = '';

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${task.title}</strong>: ${task.description}
      <button onclick="deleteTask('${task._id}')">Delete</button>
      <button onclick="updateTask('${task._id}')">Update</button>
    `;
    taskList.appendChild(li);
  });
}

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

async function deleteTask(id) {
  await fetch(`/api/tasks/${id}`, {
    method: 'DELETE'
  });
  loadTasks();
}

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

loadTasks();
