'use strict'

var thinky = require('utils/thinky')
var r = thinky.r
var { Tutorial, User, Language, Project } = require('models')
var co = require('co')

module.exports = {
  // все изменения в списке топ 10 уроков
  changes (scServer) {
    Tutorial.orderBy({ index: r.desc('createdAt') }).limit(5).changes()
    .then((feed) => feed.each((error, doc) => {
      if (error) return onError(error)

      Tutorial.get(doc.id).getJoin({author: true}).execute()
      .then((tutorial) => {
        scServer.exchange.publish('tutorials:changes', {
          isSaved: doc.isSaved(),
          value: tutorial,
          oldValue: doc.getOldValue()
        })

        scServer.exchange.publish('tutorial:' + tutorial.id + ':update', tutorial)
      })
    }))
    .error(onError)
  },

  create (socket) {
    socket.on('tutorials:create', (data, respond) => {
      const id = socket.getAuthToken().id
      if (!id) return respond('Login please')

      var title = data.title
      var content = data.content
      var source = data.source
      var keywords = data.keywords
      var languages = data.languages
      var projects = data.projects

      co(function * () {
        if (languages) {
          languages = typeof languages === 'string' ? [languages] : languages
          languages = languages.map((language) => language.value)
          languages = yield Language.getAll(...languages).run()
        }

        if (projects) {
          projects = typeof projects === 'string' ? [projects] : projects
          projects = projects.map((project) => project.value)
          projects = yield Project.getAll(...projects).run()
        }

        if (keywords) {
          keywords = keywords.split(',')
        }

        let author = yield User.get(id).run()

        var tutorial = new Tutorial({ title, content, author, source, keywords, languages, projects })

        console.log('tutorial', tutorial)

        return tutorial.saveAll()
      })
      .then((result) => {
        console.log('result', result)
        respond()
      })
      .catch(respond)
    })
  },

  find (socket) {
    socket.on('tutorials:find', (data, respond) => {
      const limit = data.limit || 5

      Tutorial
      .getJoin({ author: true, languages: true, projects: true })
      .pluck(
        'id',
        'title',
        'source',
        'domain',
        'keywords',
        'contentHtml',
        'commentsCount',
        'createdAt',
        'updatedAt',
        { author: ['id', 'username', 'fullName'] },
        { languages: ['id', 'name', 'slug'] },
        { projects: ['id', 'name', 'slug'] }
      )
      .orderBy(r.desc('createdAt'))
      .limit(limit)
      .execute()
      .then((data) => {
        socket.emit('tutorials:update', data)
        respond()
      })
    })
  },

  findOne (socket) {
    socket.on('tutorial:findOne', (data, respond) => {
      const id = data.id

      Tutorial
      .get(id)
      .getJoin({ author: true, languages: true, projects: true })
      .pluck(
        'id',
        'title',
        'source',
        'domain',
        'keywords',
        'contentHtml',
        'commentsCount',
        'createdAt',
        'updatedAt',
        { author: ['id', 'username', 'fullName'] },
        { languages: ['id', 'name', 'slug'] },
        { projects: ['id', 'name', 'slug'] }
      )
      .execute()
      .then((data) => {
        console.log('tutorial:' + data.id + ':update', data)
        socket.emit('tutorial:' + data.id + ':update', data)
        respond()
      })
    })
  }
}

function onError (error) {
  console.log(error)
  process.exit(1)
}
