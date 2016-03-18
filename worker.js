'use strict'

var express = require('express')
var serveStatic = require('serve-static')
var path = require('path')
var marked = require('marked')
var thinky = require('thinky')()
var type = thinky.type
var r = thinky.r

// Synchronous highlighting with highlight.js
marked.setOptions({
  highlight: function (code) {
    return require('highlight.js').highlightAuto(code).value
  }
})

// Create a model - the table is automatically created
var Post = thinky.createModel('Post', {
  title: type.string(),
  text: type.string(),
  html: type.string(),
  author: type.string(),
  createdAt: type.date().default(r.now())
})

Post.ensureIndex('createdAt')

module.exports.run = function (worker) {
  console.log('   >> Worker PID:', process.pid)

  var app = express()

  var httpServer = worker.httpServer
  var scServer = worker.scServer

  app.use(serveStatic(path.resolve(__dirname, 'public')))

  httpServer.on('request', app)

  Post
  .orderBy({ index: r.desc('createdAt') })
  .limit(10)
  .changes()
  .then((feed) => feed.each((error, doc) => {
    if (error) {
      console.log(error)
      return process.exit(1)
    }

    // console.log('publish changes', {
    //   isSaved: doc.isSaved(),
    //   value: doc,
    //   oldValue: doc.getOldValue()
    // })

    // if (doc.isSaved() === false) was deleted: doc
    // else if (doc.getOldValue() == null) was inserted: doc
    // else was updated : doc.getOldValue(), doc
    scServer.exchange.publish('postsChanges', {
      isSaved: doc.isSaved(),
      value: doc,
      oldValue: doc.getOldValue()
    })
  }))
  .error(function (error) {
    console.log(error)
    process.exit(1)
  })

  scServer.on('connection', (socket) => {
    socket.on('postCreate', (data, respond) => {
      data.html = data.text && marked(data.text)
      data.author = socket.getAuthToken().username
      console.log(data)
      var post = new Post(data)
      post.saveAll()
      .then((result) => respond())
      .catch(respond)
    })

    socket.on('getPosts', (data, respond) => {
      // console.log('onGetPosts', data)
      const limit = data.limit || 10
      Post
      .orderBy({ index: r.desc('createdAt') })
      .limit(10)
      .execute()
      .then((posts) => {
        // console.log('posts', posts)
        socket.emit('receivePosts', posts)
        respond()
      })
    })

    socket.on('login', function (credentials, respond) {
      var passwordHash = credentials.password // sha256(credentials.password)

      // var userQuery = 'SELECT * FROM Users WHERE username = ?'
      // mySQLClient.query(userQuery, [credentials.username], function (err, rows) {
      var userRow = credentials // rows[0]
      var isValidLogin = userRow && userRow.password === passwordHash

      console.log('userRow', userRow)

      socket.emit('whoami', userRow)

      if (isValidLogin) {
        respond()

        // This will give the client a token so that they won't
        // have to login again if they lose their connection
        // or revisit the app at a later time.
        socket.setAuthToken({ username: credentials.username })
      } else {
        // Passing string as first argument indicates error
        respond('Login failed')
      }
      // })
    })
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

