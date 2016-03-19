'use strict'

var express = require('express')
var serveStatic = require('serve-static')
var path = require('path')
var thinky = require('utils/thinky')
var r = thinky.r
var { Tutorial } = require('models')
var handlers = require('handlers')

module.exports.run = function (worker) {
  console.log('   >> Worker PID:', process.pid)

  var app = express()

  var httpServer = worker.httpServer
  var scServer = worker.scServer

  app.use(serveStatic(path.resolve(__dirname, 'public')))

  httpServer.on('request', app)

  Tutorial
  .orderBy({ index: r.desc('createdAt') })
  .limit(5)
  .changes()
  .then((feed) => feed.each((error, doc) => {
    if (error) {
      console.log(error)
      return process.exit(1)
    }
    console.log(doc)
    Tutorial
    .get(doc.id)
    .getJoin({author: true})
    .then((tutorial) => {
      scServer.exchange.publish('tutorials:changes', {
        isSaved: doc.isSaved(),
        value: tutorial,
        oldValue: doc.getOldValue()
      })
    })
  }))
  .error(function (error) {
    console.log(error)
    process.exit(1)
  })

  scServer.on('connection', (socket) => {
    handlers.tutorials.create(socket)
    handlers.tutorials.find(socket)
    handlers.auth.signup(socket)
    handlers.auth.signin(socket)
  })
}

// function (socket) {
//   // Some sample logic to show how to handle client events,
//   // replace this with your own logic

//   socket.on('postCreate', function (data, respond) {

//   })

//   // var interval = setInterval(function () {
//   //   // socket.emit('rand', {
//   //   //   rand: Math.floor(Math.random() * 5)
//   //   // })
//   //   // socket.emit('whoami', {
//   //   //   rand: Math.floor(Math.random() * 5)
//   //   // })
//   // }, 3000)

  // socket.on('login', function (credentials, respond) {
  //   var passwordHash = credentials.password // sha256(credentials.password)

  //   // var userQuery = 'SELECT * FROM Users WHERE username = ?'
  //   // mySQLClient.query(userQuery, [credentials.username], function (err, rows) {
  //   var userRow = credentials // rows[0]
  //   var isValidLogin = userRow && userRow.password === passwordHash

  //   console.log('userRow', userRow)

  //   socket.emit('whoami', userRow)

  //   if (isValidLogin) {
  //     respond()

  //     // This will give the client a token so that they won't
  //     // have to login again if they lose their connection
  //     // or revisit the app at a later time.
  //     socket.setAuthToken({ username: credentials.username })
  //   } else {
  //     // Passing string as first argument indicates error
  //     respond('Login failed')
  //   }
  //   // })
  // })

// // socket.on('disconnect', function () {
// //   // clearInterval(interval)
// // })
// })

