const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthController {
  // 登录
  async login(req, res) {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: '请输入密码' });
      }

      // 检查是否是默认密码或已有用户
      let user = await User.findOne({ where: { username: 'couple' } });

      if (!user) {
        // 首次登录，创建默认用户
        if (password !== process.env.DEFAULT_PASSWORD) {
          return res.status(401).json({ error: '密码错误' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        user = await User.create({
          username: 'couple',
          password: hashedPassword
        });
      } else {
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: '密码错误' });
        }
      }

      // 生成JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          person1Name: user.person1Name,
          person2Name: user.person2Name,
          loveStartDate: user.loveStartDate
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 更新设置
  async updateSettings(req, res) {
    try {
      const { person1Name, person2Name, loveStartDate } = req.body;
      const userId = req.userId;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }

      await user.update({
        person1Name: person1Name || user.person1Name,
        person2Name: person2Name || user.person2Name,
        loveStartDate: loveStartDate || user.loveStartDate
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          person1Name: user.person1Name,
          person2Name: user.person2Name,
          loveStartDate: user.loveStartDate
        }
      });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }

  // 获取用户信息
  async getProfile(req, res) {
    try {
      const user = req.user;
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          person1Name: user.person1Name,
          person2Name: user.person2Name,
          loveStartDate: user.loveStartDate
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  }
}

module.exports = new AuthController();