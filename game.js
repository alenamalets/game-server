const Sequelize = require('sequelize')
const sequelize = require('./db')

const Game = sequelize.define('game', {
  player1: {
    type: Sequelize.INTEGER,
  },
  player2: {
    type: Sequelize.INTEGER,
  },
  health1: {
    type: Sequelize.INTEGER,
  },
  health2: {
    type: Sequelize.INTEGER,
  },
}, {
  timestamps: false,
  tableName: 'game'
})

module.exports = Game