const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  person1Name: {
    type: DataTypes.STRING(100),
    defaultValue: '包胡呢斯图'
  },
  person2Name: {
    type: DataTypes.STRING(100),
    defaultValue: '张萨出拉'
  },
  loveStartDate: {
    type: DataTypes.DATEONLY,
    defaultValue: '2023-09-09'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'users'
});

module.exports = User;