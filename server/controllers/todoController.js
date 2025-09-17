const { Todo } = require('../models');
const { Op } = require('sequelize');

class TodoController {
  // 获取所有待办事项
  async getAllTodos(req, res) {
    try {
      const { completed, priority, category } = req.query;

      const where = { userId: req.userId };

      if (completed !== undefined) {
        where.isCompleted = completed === 'true';
      }

      if (priority) {
        where.priority = priority;
      }

      if (category) {
        where.category = category;
      }

      const todos = await Todo.findAll({
        where,
        order: [
          ['isCompleted', 'ASC'],
          ['priority', 'DESC'],
          ['createdAt', 'ASC']
        ]
      });

      res.json({
        success: true,
        data: todos
      });
    } catch (error) {
      console.error('Get todos error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 创建待办事项
  async createTodo(req, res) {
    try {
      const { content, priority, category, dueDate } = req.body;

      if (!content) {
        return res.status(400).json({ error: '内容不能为空' });
      }

      const todo = await Todo.create({
        userId: req.userId,
        content,
        priority: priority || 'medium',
        category: category || 'general',
        dueDate
      });

      res.status(201).json({
        success: true,
        data: todo
      });
    } catch (error) {
      console.error('Create todo error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 获取单个待办事项
  async getTodo(req, res) {
    try {
      const { id } = req.params;

      const todo = await Todo.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!todo) {
        return res.status(404).json({ error: '待办事项不存在' });
      }

      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      console.error('Get todo error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 更新待办事项
  async updateTodo(req, res) {
    try {
      const { id } = req.params;
      const { content, priority, category, isCompleted, dueDate } = req.body;

      const todo = await Todo.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!todo) {
        return res.status(404).json({ error: '待办事项不存在' });
      }

      const updateData = {
        content: content || todo.content,
        priority: priority || todo.priority,
        category: category || todo.category,
        dueDate: dueDate !== undefined ? dueDate : todo.dueDate
      };

      if (isCompleted !== undefined) {
        updateData.isCompleted = isCompleted;
        updateData.completedAt = isCompleted ? new Date() : null;
      }

      await todo.update(updateData);

      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      console.error('Update todo error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 删除待办事项
  async deleteTodo(req, res) {
    try {
      const { id } = req.params;

      const todo = await Todo.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!todo) {
        return res.status(404).json({ error: '待办事项不存在' });
      }

      await todo.destroy();

      res.json({
        success: true,
        message: '待办事项删除成功'
      });
    } catch (error) {
      console.error('Delete todo error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 切换完成状态
  async toggleComplete(req, res) {
    try {
      const { id } = req.params;

      const todo = await Todo.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!todo) {
        return res.status(404).json({ error: '待办事项不存在' });
      }

      await todo.update({
        isCompleted: !todo.isCompleted,
        completedAt: !todo.isCompleted ? new Date() : null
      });

      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      console.error('Toggle todo complete error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }
}

module.exports = new TodoController();