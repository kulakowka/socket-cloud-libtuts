'use strict'

var express = require('express')
var serveStatic = require('serve-static')
var path = require('path')
var thinky = require('thinky')()
var type = thinky.type
var r = thinky.r
var { Tutorial, User } = require('models')

module.exports.run = function (worker) {
  console.log('   >> Worker PID:', process.pid)

  var app = express()

  var httpServer = worker.httpServer
  var scServer = worker.scServer

  app.use(serveStatic(path.resolve(__dirname, 'public')))

  httpServer.on('request', app)

  Tutorial
  .orderBy({ index: r.desc('createdAt') })
  .limit(10)
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
      scServer.exchange.publish('tutorialsChanges', {
        isSaved: doc.isSaved(),
        value: tutorial,
        oldValue: doc.getOldValue()
      })
    })
    // console.log('publish changes', {
    //   isSaved: doc.isSaved(),
    //   value: doc,
    //   oldValue: doc.getOldValue()
    // })

    // if (doc.isSaved() === false) was deleted: doc
    // else if (doc.getOldValue() == null) was inserted: doc
    // else was updated : doc.getOldValue(), doc
    // scServer.exchange.publish('tutorialsChanges', {
    //   isSaved: doc.isSaved(),
    //   value: doc,
    //   oldValue: doc.getOldValue()
    // })
  }))
  .error(function (error) {
    console.log(error)
    process.exit(1)
  })

  scServer.on('connection', (socket) => {
    socket.on('tutorialCreate', (data, respond) => {
      // console.log('getAuthToken:', socket.getAuthToken())
      const id = socket.getAuthToken().id
      
      User.get(id).run().then((user) => {
        // console.log('USER:', user)
        data.author = user
        var tutorial = new Tutorial(data)
        return tutorial.saveAll().then((result) => respond())
      }).catch(respond)
    })

    socket.on('getTutorials', (data, respond) => {
      // console.log('getTutorials', data)
      const limit = data.limit || 10
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
        // console.log('receiveTutorials', data)
        socket.emit('receiveTutorials', data)
        respond()
      })
    })

    socket.on('login', function (credentials, respond) {
      // console.log('login credentials', credentials)
      var email = credentials.email
      var password = credentials.password
      var username = credentials.username
      User.filter({ username }).run().then((users) => {
        let user = users[0]
        // console.log('users', users)
        if (!users.length) {
          user = new User({ email, password, username })

          return user.saveAll()
          .then((user) => {
            // console.log('created user', user)
            // delete user.password
            socket.setAuthToken(user)
            respond()
          })
          .catch(respond)
        }

        // console.log('founded user', user)
        user.checkPassword(password, (err, valid) => {
          console.log('checkPassword result:', err, valid)
          // console.log('password:', password)
          // console.log('user password:', user.password)
          if (err || !valid) return respond('Incorrect password.')
          // delete user.password
          // console.log('setAuthToken 2', user)
          socket.setAuthToken(user)
          respond()
        })
      }).catch(respond)
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

