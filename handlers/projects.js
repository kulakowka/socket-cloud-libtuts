'use strict'

var thinky = require('utils/thinky')
var { Project, User } = require('models')

module.exports = {
  // все изменения в списке проектов
  changes (scServer) {
    Project.changes()
    .then((feed) => feed.each((error, doc) => {
      if (error) return onError(error)

      Project.get(doc.id).run()
      .then((project) => {
        scServer.exchange.publish('projects:changes', {
          isSaved: doc.isSaved(),
          value: project,
          oldValue: doc.getOldValue()
        })

        scServer.exchange.publish('project:' + project.id + ':update', project)
      })
    }))
    .error(onError)
  },

  create (socket) {
    socket.on('projects:create', (data, respond) => {
      const id = socket.getAuthToken().id
      var name = data.name.trim()

      User.get(id).run().then((author) => {
        var project = new Project({ name, author })
        return project.saveAll().then((result) => respond())
      }).catch(respond)
    })
  },

  find (socket) {
    socket.on('projects:find', (data, respond) => {
      Project
      .getJoin()
      .pluck(
        'id',
        'name',
        'slug',
        'tutorialsCount',
        'createdAt',
        'updatedAt',
        { author: ['id', 'username', 'fullName'] }
      )
      .execute()
      .then((data) => {
        socket.emit('projects:update', data)
        respond()
      })
    })
  },

  findOne (socket) {
    socket.on('project:findOne', (data, respond) => {
      const id = data.id

      Project
      .get(id)
      .getJoin()
      .pluck(
        'id',
        'name',
        'slug',
        'tutorialsCount',
        'createdAt',
        'updatedAt',
        { author: ['id', 'username', 'fullName'] }
      )
      .execute()
      .then((data) => {
        socket.emit('project:' + data.id + ':update', data)
        respond()
      })
    })
  }
}

function onError (error) {
  console.log(error)
  process.exit(1)
}
