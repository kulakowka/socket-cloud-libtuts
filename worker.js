'use strict'

var express = require('express')
var serveStatic = require('serve-static')
var path = require('path')

var thinky = require('thinky')()
var type = thinky.type

// Create a model - the table is automatically created
var Post = thinky.createModel('Post', {
  title: type.string(),
  text: type.string(),
  author: type.string()
})

module.exports.run = function (worker) {
  console.log('   >> Worker PID:', process.pid)

  var app = express()

  var httpServer = worker.httpServer
  var scServer = worker.scServer

  app.use(serveStatic(path.resolve(__dirname, 'public')))

  httpServer.on('request', app)

  // канал в который публикуются все эвенты обо всех постах :)
  Post.changes().then(function (feed) {
    feed.each(function (error, doc) {
      if (error) {
        console.log(error)
        return process.exit(1)
      }

      // if (doc.isSaved() === false) was deleted: doc
      // else if (doc.getOldValue() == null) was inserted: doc
      // else was updated : doc.getOldValue(), doc
      scServer.exchange.publish('postsChanges', {
        isSaved: doc.isSaved(),
        value: doc,
        oldValue: doc.getOldValue()
      })
    })
  }).error(function (error) {
    console.log(error)
    process.exit(1)
  })
  // setInterval(() => {
  //   let user = {
  //     username: 'kulakowka'
  //   }

  //   scServer.exchange.publish('user/changes', user)
  // }, 1000)

  /*
    In here we handle our incoming realtime connections and listen for events.
  */
  scServer.on('connection', function (socket) {
    // Some sample logic to show how to handle client events,
    // replace this with your own logic

    socket.on('postCreate', function (data, respond) {
      console.log('Handled postCreateEvent', data)
      var post = new Post(data)

      post.saveAll().then(function (result) {
        // scServer.exchange.publish('newPosts', result)
        respond()
      })
    })

    // var interval = setInterval(function () {
    //   // socket.emit('rand', {
    //   //   rand: Math.floor(Math.random() * 5)
    //   // })
    //   // socket.emit('whoami', {
    //   //   rand: Math.floor(Math.random() * 5)
    //   // })
    // }, 3000)

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

  // socket.on('disconnect', function () {
  //   // clearInterval(interval)
  // })
  })
}
