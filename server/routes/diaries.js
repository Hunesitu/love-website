const express = require('express');
const diaryController = require('../controllers/diaryController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取所有日记
router.get('/', diaryController.getAllDiaries);

// 创建日记
router.post('/', diaryController.createDiary);

// 搜索日记
router.get('/search', diaryController.searchDiaries);

// 获取单个日记
router.get('/:id', diaryController.getDiary);

// 更新日记
router.put('/:id', diaryController.updateDiary);

// 删除日记
router.delete('/:id', diaryController.deleteDiary);

module.exports = router;