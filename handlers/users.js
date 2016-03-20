'use strict'

var { User } = require('models')

module.exports = {
  findOne (socket) {
    socket.on('user:findOne', (data, respond) => {
      const username = data.id

      User
      .filter({ username })
      .getJoin()
      .pluck(
        'id',
        'username',
        'fullName',
        'tutorialsCount',
        'projectsCount',
        'languagesCount',
        'commentsCount',
        'createdAt',
        'updatedAt'
      )
      .execute()
      .then((users) => {
        let user = users.pop()
        if (!user) return respond('user not found')
        console.log('emit:user', user)
        socket.emit('user:' + user.username + ':update', user)
        respond()
      })
    })
  }
}
