'use strict'

var thinky = require('utils/thinky')
var r = thinky.r
var { Tutorial, User } = require('models')

module.exports = {
  tutorials: {
    create (socket) {
      socket.on('tutorialCreate', (data, respond) => {
        const id = socket.getAuthToken().id
        var title = data.title.trim()
        var content = data.content.trim()

        User.get(id).run().then((author) => {
          var tutorial = new Tutorial({ title, content, author })
          return tutorial.saveAll().then((result) => respond())
        }).catch(() => respond('User not found'))
      })
    },

    find (socket) {
      socket.on('tutorials:find', (data, respond) => {
        const limit = data.limit || 5

        Tutorial
        .getJoin({ author: true, languages: true })
        .pluck(
          'id',
          'title',
          'contentHtml',
          'commentsCount',
          'createdAt',
          'updatedAt',
          { author: ['id', 'username', 'fullName'] },
          { languages: ['id', 'name', 'slug'] }
        )
        .orderBy(r.desc('createdAt'))
        .limit(limit)
        .execute()
        .then((data) => {
          socket.emit('tutorials:update', data)
          respond()
        })
      })
    }
  },

  auth: {
    signin (socket) {
      socket.on('auth:signin', (credentials, respond) => {
        var email = credentials.email.toString().trim().toLowerCase()
        var password = credentials.password.toString().trim()

        User.filter({ email }).run().then((users) => {
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
    },

    signup (socket) {
      socket.on('auth:signup', (credentials, respond) => {
        var email = credentials.email.toString().trim().toLowerCase()
        var password = credentials.password.toString().trim()
        var username = credentials.username.toString().trim()

        let user = new User({ email, password, username })

        user.save()
        .then((user) => {
          delete user.password
          socket.setAuthToken(user)
          respond()
        }).catch(respond)
      })
    }
  }
}
