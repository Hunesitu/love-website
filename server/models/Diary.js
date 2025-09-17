const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Diary = sequelize.define('Diary', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  mood: {
    type: DataTypes.ENUM('happy', 'love', 'sad', 'excited', 'calm', 'romantic'),
    defaultValue: 'happy'
  },
  weather: {
    type: DataTypes.ENUM('sunny', 'cloudy', 'rainy', 'snowy', 'windy'),
    defaultValue: 'sunny'
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'diaries'
});

module.exports = Diary;