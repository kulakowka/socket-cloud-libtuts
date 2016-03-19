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

  httpServer.on('request', app)

  handlers.tutorials.changes(scServer)

  scServer.on('connection', (socket) => {
    handlers.tutorials.create(socket)
    handlers.tutorials.find(socket)
    handlers.auth.signup(socket)
    handlers.auth.signin(socket)
  })
}
