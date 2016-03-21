'use strict'

var express = require('express')
var serveStatic = require('serve-static')
var path = require('path')
var handlers = require('handlers')

module.exports.run = function (worker) {
  console.log('   >> Worker PID:', process.pid)

  var app = express()

  var httpServer = worker.httpServer
  var scServer = worker.scServer

  app.use(serveStatic(path.resolve(__dirname, 'public')))
  app.use('/emoji/images', serveStatic(path.resolve(__dirname, 'node_modules/emoji-parser/emoji/')))
  app.get('/shield/:slug.svg', handlers.shield.show)

  httpServer.on('request', app)

  // handlers.tutorials.changes(scServer)
  // handlers.languages.changes(scServer)
  // handlers.projects.changes(scServer)

  scServer.on('connection', handlers.tutorials)
  
    // (socket) => {
    // handlers.tutorials.create(socket)
    // handlers.tutorials.find(socket)
    // handlers.tutorials.findOne(socket)

    // handlers.languages.create(socket)
    // handlers.languages.find(socket)
    // handlers.languages.findOne(socket)

    // handlers.projects.create(socket)
    // handlers.projects.find(socket)
    // handlers.projects.findOne(socket)

    // handlers.auth.signup(socket)
    // handlers.auth.signin(socket)

    // handlers.info.findOne(socket)

    // handlers.users.findOne(socket)
  // })
}
