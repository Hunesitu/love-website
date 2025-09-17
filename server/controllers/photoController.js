const path = require('path');
const sharp = require('sharp');
const { Photo } = require('../models');

class PhotoController {
  // 获取所有照片
  async getAllPhotos(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const photos = await Photo.findAndCountAll({
        where: { userId: req.userId },
        order: [['uploadDate', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: photos.rows,
        pagination: {
          total: photos.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(photos.count / limit)
        }
      });
    } catch (error) {
      console.error('Get photos error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 上传照片
  async uploadPhotos(req, res) {
    try {
      const { title, description } = req.body;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: '请选择要上传的照片' });
      }

      const uploadedPhotos = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 生成缩略图
        const thumbnailFilename = `thumb_${file.filename}`;
        const thumbnailPath = path.join(path.dirname(file.path), thumbnailFilename);

        await sharp(file.path)
          .resize(300, 300, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);

        const photo = await Photo.create({
          userId: req.userId,
          title: files.length > 1 ? `${title} ${i + 1}` : title,
          description,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`,
          thumbnailUrl: `/uploads/${thumbnailFilename}`
        });

        uploadedPhotos.push(photo);
      }

      res.status(201).json({
        success: true,
        data: uploadedPhotos
      });
    } catch (error) {
      console.error('Upload photos error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 删除照片
  async deletePhoto(req, res) {
    try {
      const { id } = req.params;

      const photo = await Photo.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!photo) {
        return res.status(404).json({ error: '照片不存在' });
      }

      // 删除文件
      const fs = require('fs').promises;
      try {
        await fs.unlink(path.join(__dirname, '../../uploads', photo.filename));
        if (photo.thumbnailUrl) {
          const thumbnailFilename = photo.thumbnailUrl.replace('/uploads/', '');
          await fs.unlink(path.join(__dirname, '../../uploads', thumbnailFilename));
        }
      } catch (fileError) {
        console.error('Delete file error:', fileError);
      }

      await photo.destroy();

      res.json({
        success: true,
        message: '照片删除成功'
      });
    } catch (error) {
      console.error('Delete photo error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 获取单张照片
  async getPhoto(req, res) {
    try {
      const { id } = req.params;

      const photo = await Photo.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!photo) {
        return res.status(404).json({ error: '照片不存在' });
      }

      res.json({
        success: true,
        data: photo
      });
    } catch (error) {
      console.error('Get photo error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 更新照片信息
  async updatePhoto(req, res) {
    try {
      const { id } = req.params;
      const { title, description } = req.body;

      const photo = await Photo.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!photo) {
        return res.status(404).json({ error: '照片不存在' });
      }

      await photo.update({
        title: title || photo.title,
        description: description !== undefined ? description : photo.description
      });

      res.json({
        success: true,
        data: photo
      });
    } catch (error) {
      console.error('Update photo error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }
}

module.exports = new PhotoController();