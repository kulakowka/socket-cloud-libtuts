'use strict'

var { User } = require('models')

module.exports = {
  signin (socket) {
    socket.on('auth:signin', (credentials, respond) => {
      var email = credentials.email.toString().trim().toLowerCase()
      var password = credentials.password.toString().trim()

      // console.log('auth:signin:1', email, password)
      User.filter({ email }).then((users) => {
        if (!users.length) return respond('User not found.')

        let user = users.pop()

        // console.log('auth:signin:2', user.email, user.password)
        user.checkPassword(password, (err, valid) => {
          // console.log(err, valid)
          if (err || !valid) return respond('Incorrect password.')
          delete user.password
          socket.setAuthToken(user)
          respond()
        })
      }).catch(respond)
    })
  },

  signup (socket) {
    socket.on('auth:signup', (credentials, respond) => {
      var email = credentials.email.toString().trim().toLowerCase()
      var password = credentials.password.toString().trim()
      var username = credentials.username.toString().trim()

      // console.log('auth:signup:1', username, email, password)

      let user = new User({ email, password, username })

      // console.log('auth:signup:1', user)

      user.saveAll().then((data) => {
        // console.log('user created', data)
        // delete user.password
        socket.setAuthToken(data)
        respond()
      }).catch(respond)
    })
  }
}
