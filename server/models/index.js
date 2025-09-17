const sequelize = require('../config/database');
const User = require('./User');
const Diary = require('./Diary');
const Photo = require('./Photo');
const Memorial = require('./Memorial');
const Todo = require('./Todo');
const Message = require('./Message');

// 定义关联关系
User.hasMany(Diary, { foreignKey: 'userId', as: 'diaries' });
Diary.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Photo, { foreignKey: 'userId', as: 'photos' });
Photo.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Memorial, { foreignKey: 'userId', as: 'memorials' });
Memorial.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Todo, { foreignKey: 'userId', as: 'todos' });
Todo.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Message, { foreignKey: 'userId', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Diary,
  Photo,
  Memorial,
  Todo,
  Message
};