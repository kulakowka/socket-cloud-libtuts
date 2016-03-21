'use strict'

var { User } = require('models')

module.exports = function onConnection (socket) {
  socket.on('auth:signin', (credentials, respond) => {
    var email = credentials.email.toString().trim().toLowerCase()
    var password = credentials.password.toString().trim()

    User.filter({ email }).then((users) => {
      if (!users.length) return respond('User not found.')

      let user = users.pop()

      user.checkPassword(password, (err, valid) => {
        if (err || !valid) return respond('Incorrect password.')
        delete user.password
        socket.setAuthToken(user)
        respond()
      })
    }).catch(respond)
  })

  socket.on('auth:signup', (credentials, respond) => {
    var email = credentials.email.toString().trim().toLowerCase()
    var password = credentials.password.toString().trim()
    var username = credentials.username.toString().trim()

    let user = new User({ email, password, username })

    user.saveAll().then((data) => {
      delete user.password
      socket.setAuthToken(data)
      respond()
    }).catch(respond)
  })
}

