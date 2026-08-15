const Task = require('../models/Task');

/**
 * @desc    Get all tasks with pagination and status/priority filtering
 * @route   GET /api/tasks
 * @access  Private (ADMIN, DEVELOPER, VIEWER)
 */
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;

    // Build filter query object
    const query = {};
    if (status) query.status = status.toUpperCase();
    if (priority) query.priority = priority.toUpperCase();

    // Calculate pagination values
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Execute query with population, sorting, and pagination
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count matching query filter
    const total = await Task.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new task/incident
 * @route   POST /api/tasks
 * @access  Private (ADMIN, DEVELOPER)
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, assignedTo } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and description for the task'
      });
    }

    const task = await Task.create({
      title,
      description,
      status: status ? status.toUpperCase() : 'OPEN',
      priority: priority ? priority.toUpperCase() : 'MEDIUM',
      assignedTo: assignedTo || null,
      createdBy: req.user._id
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');

    return res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task status
 * @route   PATCH /api/tasks/:id
 * @access  Private (ADMIN, DEVELOPER)
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

    if (!status || !allowedStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Status must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task not found with ID ${id}`
      });
    }

    task.status = status.toUpperCase();
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');

    return res.status(200).json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private (ADMIN only)
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task not found with ID ${id}`
      });
    }

    await task.deleteOne();

    return res.status(200).json({
      success: true,
      message: `Task with ID ${id} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask
};
