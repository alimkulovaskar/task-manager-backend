const { ObjectId } = require('mongodb');

function validateTask(req, res, next) {
  const { title, description, dueDate, projectId } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      error: "Title and description are required"
    });
  }

  if (title.length < 3) {
    return res.status(400).json({
      error: "Title must be at least 3 characters"
    });
  }

  if (description.length < 3) {
    return res.status(400).json({
      error: "Description must be at least 3 characters"
    });
  }

  if (dueDate && isNaN(Date.parse(dueDate))) {
    return res.status(400).json({
      error: "Invalid due date format"
    });
  }

  if (projectId && !ObjectId.isValid(projectId)) {
    return res.status(400).json({
      error: "Invalid project ID"
    });
  }

  next();
}

module.exports = validateTask;
