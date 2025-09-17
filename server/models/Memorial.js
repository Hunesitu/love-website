const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Memorial = sequelize.define('Memorial', {
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
  description: {
    type: DataTypes.TEXT
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  importance: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  category: {
    type: DataTypes.STRING(100),
    defaultValue: 'anniversary'
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'memorials'
});

module.exports = Memorial;