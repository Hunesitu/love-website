const { Memorial } = require('../models');
const { Op } = require('sequelize');

class MemorialController {
  // 获取所有纪念日
  async getAllMemorials(req, res) {
    try {
      const memorials = await Memorial.findAll({
        where: { userId: req.userId },
        order: [['date', 'ASC']]
      });

      res.json({
        success: true,
        data: memorials
      });
    } catch (error) {
      console.error('Get memorials error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 创建纪念日
  async createMemorial(req, res) {
    try {
      const { title, description, date, importance, category, isRecurring } = req.body;

      if (!title || !date) {
        return res.status(400).json({ error: '标题和日期不能为空' });
      }

      const memorial = await Memorial.create({
        userId: req.userId,
        title,
        description,
        date,
        importance: importance || 'medium',
        category: category || 'anniversary',
        isRecurring: isRecurring !== undefined ? isRecurring : true
      });

      res.status(201).json({
        success: true,
        data: memorial
      });
    } catch (error) {
      console.error('Create memorial error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 获取单个纪念日
  async getMemorial(req, res) {
    try {
      const { id } = req.params;

      const memorial = await Memorial.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!memorial) {
        return res.status(404).json({ error: '纪念日不存在' });
      }

      res.json({
        success: true,
        data: memorial
      });
    } catch (error) {
      console.error('Get memorial error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 更新纪念日
  async updateMemorial(req, res) {
    try {
      const { id } = req.params;
      const { title, description, date, importance, category, isRecurring } = req.body;

      const memorial = await Memorial.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!memorial) {
        return res.status(404).json({ error: '纪念日不存在' });
      }

      await memorial.update({
        title: title || memorial.title,
        description: description !== undefined ? description : memorial.description,
        date: date || memorial.date,
        importance: importance || memorial.importance,
        category: category || memorial.category,
        isRecurring: isRecurring !== undefined ? isRecurring : memorial.isRecurring
      });

      res.json({
        success: true,
        data: memorial
      });
    } catch (error) {
      console.error('Update memorial error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 删除纪念日
  async deleteMemorial(req, res) {
    try {
      const { id } = req.params;

      const memorial = await Memorial.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!memorial) {
        return res.status(404).json({ error: '纪念日不存在' });
      }

      await memorial.destroy();

      res.json({
        success: true,
        message: '纪念日删除成功'
      });
    } catch (error) {
      console.error('Delete memorial error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 获取即将到来的纪念日
  async getUpcomingMemorials(req, res) {
    try {
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(today.getMonth() + 1);

      // 获取下个月内的纪念日
      const memorials = await Memorial.findAll({
        where: {
          userId: req.userId,
          [Op.or]: [
            {
              date: {
                [Op.between]: [today.toISOString().split('T')[0], nextMonth.toISOString().split('T')[0]]
              }
            },
            {
              isRecurring: true
            }
          ]
        },
        order: [['date', 'ASC']]
      });

      // 处理重复纪念日
      const upcomingMemorials = memorials.filter(memorial => {
        if (!memorial.isRecurring) {
          return true;
        }

        // 简单的年度重复逻辑
        const memorialDate = new Date(memorial.date);
        const thisYear = new Date(today.getFullYear(), memorialDate.getMonth(), memorialDate.getDate());
        const nextYear = new Date(today.getFullYear() + 1, memorialDate.getMonth(), memorialDate.getDate());

        return thisYear >= today || nextYear >= today;
      });

      res.json({
        success: true,
        data: upcomingMemorials
      });
    } catch (error) {
      console.error('Get upcoming memorials error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }
}

module.exports = new MemorialController();