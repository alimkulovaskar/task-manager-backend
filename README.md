# Task Manager – Assignment 2 Part 2

This project is a simple **Task Manager** web application developed as part of  
**Web Technologies 2 – Assignment 2 (Part 2: Database Integration and CRUD API)**.

The project demonstrates how to connect an Express.js application to a database
and implement full CRUD operations with proper validation and HTTP status codes.

---

## Technologies Used
- Node.js
- Express.js
- SQLite
- HTML
- CSS

---

## Database
**Database:** SQLite  
**Database file:** `database.db`

### Table: tasks
| Field       | Type    | Description                  |
|------------|---------|------------------------------|
| id         | INTEGER | Primary key (auto-increment) |
| title      | TEXT    | Task title                   |
| description| TEXT    | Task description             |

The database and table are created automatically when the server starts.

---

## API Routes (CRUD)

### Get all tasks
**GET** `/api/tasks`  
Returns all tasks sorted by id in ascending order.

### Get task by id
**GET** `/api/tasks/:id`  
Returns a single task by id.

### Create a new task
**POST** `/api/tasks`  
**Body (JSON):**
```json
{
  "title": "New task",
  "description": "Task description"
}
Status: 201 Created

Update a task
PUT /api/tasks/:id
Body (JSON):

json
Копировать код
{
  "title": "Updated task",
  "description": "Updated description"
}
Status: 200 OK

Delete a task
DELETE /api/tasks/:id
Deletes a task by id.
Status: 200 OK

Validation and Status Codes
200 OK — successful GET, PUT, DELETE

201 Created — successful POST

400 Bad Request — invalid id or missing fields

404 Not Found — task not found

500 Internal Server Error — database error

Pages
/ – Home

/about – About page

/contact – Contact form

/search – Query parameter example

/item/:id – Route parameter example

How to Run the Project
Install dependencies:

bash
Копировать код
npm install
Start the server:

bash
Копировать код
node server.js
Open in browser:

arduino
Копировать код
http://localhost:3000
Team Members
Alimkulov Askar – SE-2428

Zhanadil Bexultan – SE-2428

Turaly Aruzhan – SE-2428

Assignment Coverage
Database integration (SQLite)

Full CRUD API (Create, Read, Update, Delete)

Server-side validation

Proper HTTP status codes

REST-style API design