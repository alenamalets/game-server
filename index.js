const express = require('express')
const socketIo = require('socket.io')
const cors = require('cors')
const bodyParser = require('body-parser')
const User = require('./users')
const Game = require('./game')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const app = express()


app.use(cors())
app.use(bodyParser.json())

//------USERS----------
app.post('/users', (req, res, next) => {
    const user = {
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 5),
        name: req.body.name
    }
    User
    .create(user)
    .then(user => {
      if (!user) {
        return res.status(404).send({
          message: `User does not exist`
        })
      }
      return res.status(201).send(user)
    })
    .then (dispatchUsers)
    .catch(error => next(error))
})


function dispatchUsers() { 
    User.findAll()
      .then(users => {
        io.emit(
            'action',
            { type: 'USERS', payload: users } 
        )
      })
      .catch(error => next(error))
}

//--------GAME---------
app.post('/game', (req, res, next) => {
  console.log('ggg', req.body);
  
  const game = {
    player1: req.body.player1,
    player2: req.body.player2,
    health1: 100,
    health2:100,
}
  Game
  .create(game)
  .then(game => {
    if (!game) {
      return res.status(404).send({
        message: `game does not exist`
      })
    }
    dispatchGame(game.id)
    return res.status(201).send(game)
  })
  .then (dispatchGames)
  .catch(error => next(error))
  
})

function dispatchGames() { 
  Game.findAll()
    .then(game => {
      io.emit(
          'action',
          { type: 'GAME', payload: game } 
      )
    })
    .catch(error => next(error))
}

function dispatchGame(id) { 
  Game.findByPk(id)
    .then(game => {
      io.emit(
          'action',
          { type: 'CURRENT_GAME', payload: game } 
      )
    })
    .catch(error => next(error))
}


//------LISTEN-----
function onListen() {
    console.log('Listening on port 4000');   
}
const server = app.listen(4000,onListen )

const io = socketIo.listen(server)

io.on('connection', client => {
    console.log('client.id test', client.id);  

dispatchUsers()
dispatchGames()
dispatchGame()

client.on('disconnect', () => {
    console.log('disconnect test', client.id); 
})
})


//---------LOGINS-----------
const secret = process.env.JWT_SECRET || 'e9rp^&^*&@9sejg)DSUA)jpfds8394jdsfn,m'

function toJWT(data) {
  return jwt.sign(data, secret, { expiresIn: '2h' })
}

app.post('/logins', (req, res) => {  
    const email = req.body.email
    const password = req.body.password
  
    if (!email || !password) {
      res.status(400).send({
        message: 'Please supply a valid email and password'
      })
    }
    else {
      // 1. find user based on email address
      User
        .findOne({
          where: {
            email: req.body.email
          }
        })
        .then(entity => {
          if (!entity) {
            res.status(400).send({
              message: 'User with that email does not exist'
            })
          }
  
          // 2. use bcrypt.compareSync to check the password against the stored hash
          if (bcrypt.compareSync(req.body.password, entity.password)) {
  
            // 3. if the password is correct, return a JWT with the userId of the user (user.id)
            res.send({
              jwt: toJWT({ userId: entity.id }),
              userid: entity.id
            })
          }
          else {
            res.status(400).send({
              message: 'Password was incorrect'
            })
          }
        })
        .catch(err => {
          console.error(err)
          res.status(500).send({
            message: 'Something went wrong'
          })
        })

    }
})
  