'use strict'

var thinky = require('utils/thinky')
var r = thinky.r
var { Tutorial, User } = require('models')

module.exports = {
  // все изменения в списке топ 10 уроков
  changes (scServer) {
    Tutorial.orderBy({ index: r.desc('createdAt') }).limit(5).changes()
    .then((feed) => feed.each((error, doc) => {
      if (error) return onError(error)

      Tutorial.get(doc.id).getJoin({author: true})
      .then((tutorial) => {
        scServer.exchange.publish('tutorials:changes', {
          isSaved: doc.isSaved(),
          value: tutorial,
          oldValue: doc.getOldValue()
        })
      })
    }))
    .error(onError)
  },

  create (socket) {
    socket.on('tutorials:create', (data, respond) => {
      const id = socket.getAuthToken().id
      var title = data.title.trim()
      var content = data.content.trim()

      User.get(id).run().then((author) => {
        var tutorial = new Tutorial({ title, content, author })
        return tutorial.saveAll().then((result) => respond())
      }).catch(respond)
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
}

function onError (error) {
  console.log(error)
  process.exit(1)
}
