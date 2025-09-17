const express = require('express');
const photoController = require('../controllers/photoController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取所有照片
router.get('/', photoController.getAllPhotos);

// 上传照片
router.post('/upload', upload.array('photos', 5), photoController.uploadPhotos);

// 获取单张照片
router.get('/:id', photoController.getPhoto);

// 更新照片信息
router.put('/:id', photoController.updatePhoto);

// 删除照片
router.delete('/:id', photoController.deletePhoto);

module.exports = router;