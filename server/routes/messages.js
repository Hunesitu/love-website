const express = require('express');
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取所有悄悄话
router.get('/', messageController.getAllMessages);

// 创建悄悄话
router.post('/', messageController.createMessage);

// 获取特殊悄悄话
router.get('/special', messageController.getSpecialMessages);

// 获取单条悄悄话
router.get('/:id', messageController.getMessage);

// 更新悄悄话
router.put('/:id', messageController.updateMessage);

// 删除悄悄话
router.delete('/:id', messageController.deleteMessage);

module.exports = router;