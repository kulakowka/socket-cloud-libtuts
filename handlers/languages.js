'use strict'

var thinky = require('utils/thinky')
var { Language, User } = require('models')

module.exports = {
  // все изменения в списке языков
  changes (scServer) {
    Language.changes()
    .then((feed) => feed.each((error, doc) => {
      if (error) return onError(error)

      Language.get(doc.id).execute()
      .then((language) => {
        scServer.exchange.publish('languages:changes', {
          isSaved: doc.isSaved(),
          value: language,
          oldValue: doc.getOldValue()
        })

        scServer.exchange.publish('language:' + language.slug + ':update', language)
      })
    }))
    .error(onError)
  },

  create (socket) {
    socket.on('languages:create', (data, respond) => {
      const id = socket.getAuthToken().id
      var name = data.name.trim()

      User.get(id).run().then((author) => {
        var language = new Language({ name, author })
        return language.saveAll().then((result) => respond())
      }).catch(respond)
    })
  },

  find (socket) {
    socket.on('languages:find', (data, respond) => {
      Language
      .getJoin()
      .pluck(
        'id',
        'name',
        'slug',
        'tutorialsCount',
        'projectsCount',
        'createdAt',
        'updatedAt',
        { author: ['id', 'username', 'fullName'] }
      )
      .execute()
      .then((data) => {
        socket.emit('languages:update', data)
        respond()
      })
    })
  },

  findOne (socket) {
    socket.on('language:findOne', (data, respond) => {
      const slug = data.id

      Language
      .filter({ slug })
      .getJoin()
      .pluck(
        'id',
        'name',
        'slug',
        'tutorialsCount',
        'projectsCount',
        'createdAt',
        'updatedAt',
        { author: ['id', 'username', 'fullName'] }
      )
      .execute()
      .then((languages) => {
        let language = languages.pop()
        if (!language) return respond('not found')
        console.log('emit:language', language)
        socket.emit('language:' + language.slug + ':update', language)
        respond()
      })
    })
  }
}

function onError (error) {
  console.log(error)
  process.exit(1)
}
