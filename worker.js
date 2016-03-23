'use strict'

var { Tutorial, Comment, Language, Project } = require('models')
var express = require('express')
var serveStatic = require('serve-static')
var path = require('path')
var handlers = require('handlers')

module.exports.run = function (worker) {
  console.log('   >> Worker PID:', process.pid)

  var app = express()

  var httpServer = worker.httpServer
  var scServer = worker.scServer

  // HTTP
  app.use(serveStatic(path.resolve(__dirname, 'public')))
  app.use('/emoji/images', serveStatic(path.resolve(__dirname, 'node_modules/emoji-parser/emoji/')))
  app.get('/shield/:slug.svg', handlers.shield.show)

  // Mount app
  httpServer.on('request', app)

  // WebSocket
  scServer.on('connection', handlers.auth)
  scServer.on('connection', handlers.comments)
  scServer.on('connection', handlers.info)
  scServer.on('connection', handlers.languages)
  scServer.on('connection', handlers.projects)
  scServer.on('connection', handlers.tutorials)
  scServer.on('connection', handlers.users)

  publishChanges({
    model: Tutorial,
    name: 'tutorials',
    scServer
  })

  publishChanges({
    model: Comment,
    name: 'comments',
    scServer
  })

  publishChanges({
    model: Language,
    name: 'languages',
    scServer
  })

  publishChanges({
    model: Project,
    name: 'projects',
    scServer
  })
}

function publishChanges (options) {
  let { model, name, scServer } = options
  // let name = model.getTableName().toLowerCase()

  model.changes().then((feed) => {
    feed.each((_err, item) => {
      model.get(item.id).getJoin().run().then((data) => {
        console.log('scServer.exchange.publish', name + '/' + data.id, data)
        scServer.exchange.publish(name + '/' + data.id, data)
      })
    })
  })
}
