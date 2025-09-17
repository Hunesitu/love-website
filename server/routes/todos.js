const express = require('express');
const todoController = require('../controllers/todoController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取所有待办事项
router.get('/', todoController.getAllTodos);

// 创建待办事项
router.post('/', todoController.createTodo);

// 获取单个待办事项
router.get('/:id', todoController.getTodo);

// 更新待办事项
router.put('/:id', todoController.updateTodo);

// 删除待办事项
router.delete('/:id', todoController.deleteTodo);

// 切换完成状态
router.patch('/:id/toggle', todoController.toggleComplete);

module.exports = router;