Task Manager – Assignment 4

Web Technologies 2 (Back End)

This project is a Task Manager web application developed as part of
Web Technologies 2 – Assignment 4 (Authentication, Sessions, and Protected CRUD).

The project demonstrates:

session-based authentication,

protected CRUD operations,

MongoDB database integration,

RESTful API design.

Technologies Used

Node.js

Express.js

MongoDB (MongoDB Atlas)

express-session

HTML

CSS

JavaScript (Fetch API)

Database

Database: MongoDB Atlas
Database name: taskmanager
Collection: tasks

Collection: tasks
Field	Type	Description
_id	ObjectId	Primary key
title	String	Task title
description	String	Task description
Authentication & Sessions

Session-based authentication using express-session

Login endpoint stores user data in session

All CRUD API routes are protected

Unauthorized users cannot access /api/tasks

API Routes (Protected CRUD)
Login

POST /login
Body (JSON):

{
  "username": "user",
  "password": "password"
}


Status: 200 OK / 401 Unauthorized

Get all tasks

GET /api/tasks
Returns all tasks (only for authenticated users).

Status: 200 OK

Get task by ID

GET /api/tasks/:id
Returns a single task by MongoDB ObjectId.

Status: 200 OK / 400 Bad Request / 404 Not Found

Create a new task

POST /api/tasks
Body (JSON):

{
  "title": "New task",
  "description": "Task description"
}


Status: 201 Created

Update a task

PUT /api/tasks/:id
Body (JSON):

{
  "title": "Updated task",
  "description": "Updated description"
}


Status: 200 OK / 404 Not Found

Delete a task

DELETE /api/tasks/:id

Status: 200 OK / 404 Not Found

Validation & Status Codes

200 OK – successful GET, PUT, DELETE

201 Created – successful POST

400 Bad Request – invalid input or ObjectId

401 Unauthorized – not authenticated

404 Not Found – resource not found

500 Internal Server Error – database error

Pages

/ – Home (Login + Task Manager UI)

/about – About page

/contact – Contact form

/search – Query parameter example

/item/:id – Route parameter example

How to Run the Project

Install dependencies:

npm install


Create .env file:

PORT=3000
MONGODB_URI=your_mongodb_connection_string


Start the server:

node server.js


Open in browser:

http://localhost:3000

Team Members

Alimkulov Askar – SE-2428

Zhanadil Bexultan – SE-2428

Turaly Aruzhan – SE-2428

Assignment Coverage

✔ MongoDB database integration
✔ RESTful CRUD API
✔ Authentication (Login)
✔ Session-based authorization
✔ Protected routes
✔ Server-side validation
✔ Proper HTTP status codes
✔ Frontend ↔ Backend interaction