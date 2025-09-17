const { Diary } = require('../models');
const { Op } = require('sequelize');

class DiaryController {
  // 获取所有日记
  async getAllDiaries(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const diaries = await Diary.findAndCountAll({
        where: { userId: req.userId },
        order: [['date', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: diaries.rows,
        pagination: {
          total: diaries.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(diaries.count / limit)
        }
      });
    } catch (error) {
      console.error('Get diaries error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 创建日记
  async createDiary(req, res) {
    try {
      const { title, content, mood, weather, date, images = [] } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: '标题和内容不能为空' });
      }

      const diary = await Diary.create({
        userId: req.userId,
        title,
        content,
        mood: mood || 'happy',
        weather: weather || 'sunny',
        date: date || new Date().toISOString().split('T')[0],
        images
      });

      res.status(201).json({
        success: true,
        data: diary
      });
    } catch (error) {
      console.error('Create diary error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 获取单个日记
  async getDiary(req, res) {
    try {
      const { id } = req.params;

      const diary = await Diary.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!diary) {
        return res.status(404).json({ error: '日记不存在' });
      }

      res.json({
        success: true,
        data: diary
      });
    } catch (error) {
      console.error('Get diary error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 更新日记
  async updateDiary(req, res) {
    try {
      const { id } = req.params;
      const { title, content, mood, weather, date, images } = req.body;

      const diary = await Diary.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!diary) {
        return res.status(404).json({ error: '日记不存在' });
      }

      await diary.update({
        title: title || diary.title,
        content: content || diary.content,
        mood: mood || diary.mood,
        weather: weather || diary.weather,
        date: date || diary.date,
        images: images !== undefined ? images : diary.images
      });

      res.json({
        success: true,
        data: diary
      });
    } catch (error) {
      console.error('Update diary error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 删除日记
  async deleteDiary(req, res) {
    try {
      const { id } = req.params;

      const diary = await Diary.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!diary) {
        return res.status(404).json({ error: '日记不存在' });
      }

      await diary.destroy();

      res.json({
        success: true,
        message: '日记删除成功'
      });
    } catch (error) {
      console.error('Delete diary error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 搜索日记
  async searchDiaries(req, res) {
    try {
      const { q, mood, weather } = req.query;

      const where = { userId: req.userId };

      if (q) {
        where[Op.or] = [
          { title: { [Op.like]: `%${q}%` } },
          { content: { [Op.like]: `%${q}%` } }
        ];
      }

      if (mood) {
        where.mood = mood;
      }

      if (weather) {
        where.weather = weather;
      }

      const diaries = await Diary.findAll({
        where,
        order: [['date', 'DESC'], ['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: diaries
      });
    } catch (error) {
      console.error('Search diaries error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }
}

module.exports = new DiaryController();