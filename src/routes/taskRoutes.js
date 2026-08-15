const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all task endpoints with JWT verification middleware
router.use(protect);

// GET /api/tasks - Fetch tasks (Accessible by ADMIN, DEVELOPER, VIEWER)
// POST /api/tasks - Create task (Accessible by ADMIN, DEVELOPER)
router
  .route('/')
  .get(getTasks)
  .post(authorize('ADMIN', 'DEVELOPER'), createTask);

// PATCH /api/tasks/:id - Update task status (Accessible by ADMIN, DEVELOPER)
// DELETE /api/tasks/:id - Delete task (Accessible by ADMIN only)
router
  .route('/:id')
  .patch(authorize('ADMIN', 'DEVELOPER'), updateTaskStatus)
  .delete(authorize('ADMIN'), deleteTask);

module.exports = router;
