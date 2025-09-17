const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 登录
router.post('/login', authController.login);

// 获取用户信息 (需要认证)
router.get('/profile', authMiddleware, authController.getProfile);

// 更新设置 (需要认证)
router.put('/settings', authMiddleware, authController.updateSettings);

module.exports = router;