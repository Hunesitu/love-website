const { Message } = require('../models');

class MessageController {
  // 获取所有悄悄话
  async getAllMessages(req, res) {
    try {
      const messages = await Message.findAll({
        where: { userId: req.userId },
        order: [['messageDate', 'DESC']]
      });

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 创建悄悄话
  async createMessage(req, res) {
    try {
      const { content, author, isSpecial } = req.body;

      if (!content || !author) {
        return res.status(400).json({ error: '内容和作者不能为空' });
      }

      const message = await Message.create({
        userId: req.userId,
        content,
        author,
        isSpecial: isSpecial || false
      });

      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Create message error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 获取单条悄悄话
  async getMessage(req, res) {
    try {
      const { id } = req.params;

      const message = await Message.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!message) {
        return res.status(404).json({ error: '悄悄话不存在' });
      }

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Get message error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 更新悄悄话
  async updateMessage(req, res) {
    try {
      const { id } = req.params;
      const { content, author, isSpecial } = req.body;

      const message = await Message.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!message) {
        return res.status(404).json({ error: '悄悄话不存在' });
      }

      await message.update({
        content: content || message.content,
        author: author || message.author,
        isSpecial: isSpecial !== undefined ? isSpecial : message.isSpecial
      });

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Update message error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 删除悄悄话
  async deleteMessage(req, res) {
    try {
      const { id } = req.params;

      const message = await Message.findOne({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!message) {
        return res.status(404).json({ error: '悄悄话不存在' });
      }

      await message.destroy();

      res.json({
        success: true,
        message: '悄悄话删除成功'
      });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 获取特殊悄悄话
  async getSpecialMessages(req, res) {
    try {
      const messages = await Message.findAll({
        where: {
          userId: req.userId,
          isSpecial: true
        },
        order: [['messageDate', 'DESC']]
      });

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Get special messages error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }
}

module.exports = new MessageController();