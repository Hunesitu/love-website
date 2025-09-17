const express = require('express');
const memorialController = require('../controllers/memorialController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取所有纪念日
router.get('/', memorialController.getAllMemorials);

// 创建纪念日
router.post('/', memorialController.createMemorial);

// 获取即将到来的纪念日
router.get('/upcoming', memorialController.getUpcomingMemorials);

// 获取单个纪念日
router.get('/:id', memorialController.getMemorial);

// 更新纪念日
router.put('/:id', memorialController.updateMemorial);

// 删除纪念日
router.delete('/:id', memorialController.deleteMemorial);

module.exports = router;