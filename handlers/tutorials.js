'use strict'

var thinky = require('utils/thinky')
var r = thinky.r
var { Tutorial, User, Language, Project } = require('models')
var co = require('co')

// function onTutorials (data, next) {
//   Tutorial.getJoin({
//     author: true,
//     languages: true,
//     projects: true
//   }).pluck(
//     'id',
//     'title',
//     'source',
//     'domain',
//     'keywords',
//     'contentHtml',
//     'commentsCount',
//     'createdAt',
//     'updatedAt',
//     { author: ['id', 'username', 'fullName'] },
//     { languages: ['id', 'name', 'slug'] },
//     { projects: ['id', 'name', 'slug'] }
//   )
//   .orderBy(r.desc('createdAt'))
//   .execute()
//   .then((items) => this.emit('tutorials', items, next))
//   .catch(next)
// }
// function onTutorial (data, next) {
//   Tutorial
//   .get(data.id)
//   .getJoin()
//   .run()
//   .then((item) => {
//     this.emit('tutorial', item, next)
//   })
//   .catch(next)
// }

function getTutorialsFeed (data) {
  return Tutorial.orderBy({ index: r.desc('createdAt') }).changes({ includeInitial: true })
}

module.exports = function onConnection (socket) {
  // this === scServer
  var _feed = null
  var onTutorials = function (data, next) {
    getTutorialsFeed(data).then((feed) => {
      if (_feed) _feed.close()

      _feed = feed

      feed.each((error, doc) => {
        if (error) return console.log('ERROR:', error)

        console.log('%s feed each doc', doc.id, doc.title)

        if (doc.isSaved()) {
          if (doc.getOldValue() && doc.getOldValue().id !== doc.id) {
            this.emit('tutorials:delete', doc.getOldValue())
          }
          Tutorial.get(doc.id).getJoin().execute().then((tutorial) => {
            this.emit('tutorials:set', tutorial)
          })
        } else {
          this.emit('tutorials:delete', doc)
        }
      })
      next()
    })
    .catch(next)
  }
  let stop = function () {
    socket.off('tutorials', onTutorials)
    _feed.close()
  }
  socket.on('tutorials:start', onTutorials)
  socket.on('tutorials:stop', stop)
  socket.on('disconnect', stop)
}

// var test = {
//   // все изменения в списке топ 10 уроков
//   changes (scServer) {
//     Tutorial.orderBy({ index: r.desc('createdAt') }).limit(5).changes()
//     .then((feed) => feed.each((error, doc) => {
//       if (error) return onError(error)

//       Tutorial.get(doc.id).getJoin({author: true}).execute()
//       .then((tutorial) => {
//         scServer.exchange.publish('tutorials:changes', {
//           isSaved: doc.isSaved(),
//           value: tutorial,
//           oldValue: doc.getOldValue()
//         })

//         scServer.exchange.publish('tutorial:' + tutorial.id + ':update', tutorial)
//       })
//     }))
//     .error(onError)
//   },

//   create (socket) {
//     socket.on('tutorials:create', (data, respond) => {
//       const id = socket.getAuthToken().id
//       if (!id) return respond('Login please')

//       var title = data.title
//       var content = data.content
//       var source = data.source
//       var keywords = data.keywords
//       var languages = data.languages
//       var projects = data.projects

//       co(function * () {
//         if (languages) {
//           languages = typeof languages === 'string' ? [languages] : languages
//           languages = languages.map((language) => language.value)
//           languages = yield Language.getAll(...languages).run()
//         }

//         if (projects) {
//           projects = typeof projects === 'string' ? [projects] : projects
//           projects = projects.map((project) => project.value)
//           projects = yield Project.getAll(...projects).run()
//         }

//         if (keywords) {
//           keywords = keywords.split(',')
//         }

//         let author = yield User.get(id).run()

//         var tutorial = new Tutorial({ title, content, author, source, keywords, languages, projects })

//         console.log('tutorial', tutorial)

//         return tutorial.saveAll()
//       })
//       .then((result) => {
//         // console.log('result', result)
//         respond()
//       })
//       .catch(respond)
//     })
//   },

//   find (socket) {
//     scServer.on('connection', (socket) => {
//     // find all
//     socket.on('tutorials', wrap(function * (data, next) {
//       // let offset = data.offset || 0
//       // let limit = data.offset || 30

//       let feeds = yield Tutorial.orderBy({ index: r.desc('createdAt') })
//                                 // .pluck('id')
//                                 // .slice(11, 21)
//                                 // .limit(limit)
//                                 .changes({ includeInitial: true })

//       feeds.each((error, doc) => {
//         if (error) return console.log('ERROR:', error)

//         console.log('')
//         console.log('doc', doc)

//         if (doc.isSaved()) {
//           if (doc.getOldValue() && doc.getOldValue().id !== doc.id) {
//             socket.emit('tutorials:delete', doc.getOldValue())
//           }
//           Tutorial.get(doc.id).getJoin().execute().then((tutorial) => {
//             socket.emit('tutorials:set', tutorial)
//           })
//         } else {
//           socket.emit('tutorials:delete', doc)
//         }
//       })

//       next()
//     }))

//     // find one
//     // socket.on('post', function (data, next) {
//     //   let id = data.id

//     //   let posts = [
//     //     { id: 1, title: 'post1' }
//     //   ] //yield Post.filter({ id }).run()
//     //   let post = posts.pop()

//     //   if (!post) return next('Post not found')

//     //   socket.emit('post', post, next)
//     // })

//     // стоп

//     socket.on('tutorials:find', (data, respond) => {
//       const limit = data.limit || 5

//       Tutorial
//       .getJoin({ author: true, languages: true, projects: true })
//       .pluck(
//         'id',
//         'title',
//         'source',
//         'domain',
//         'keywords',
//         'contentHtml',
//         'commentsCount',
//         'createdAt',
//         'updatedAt',
//         { author: ['id', 'username', 'fullName'] },
//         { languages: ['id', 'name', 'slug'] },
//         { projects: ['id', 'name', 'slug'] }
//       )
//       .orderBy(r.desc('createdAt'))
//       .limit(limit)
//       .execute()
//       .then((data) => {
//         socket.emit('tutorials:update', data)
//         respond()
//       })
//     })
//   },

//   findOne (socket) {
//     socket.on('tutorial:findOne', (data, respond) => {
//       const id = data.id

//       Tutorial
//       .get(id)
//       .getJoin({ author: true, languages: true, projects: true })
//       .pluck(
//         'id',
//         'title',
//         'source',
//         'domain',
//         'keywords',
//         'contentHtml',
//         'commentsCount',
//         'createdAt',
//         'updatedAt',
//         { author: ['id', 'username', 'fullName'] },
//         { languages: ['id', 'name', 'slug'] },
//         { projects: ['id', 'name', 'slug'] }
//       )
//       .execute()
//       .then((data) => {
//         // console.log('tutorial:' + data.id + ':update', data)
//         socket.emit('tutorial:' + data.id + ':update', data)
//         respond()
//       })
//     })
//   }
// }

function onError (error) {
  console.log(error)
  process.exit(1)
}

function wrap (handler) {
  var fn = co.wrap(handler)

  return (data, next) =>
    fn(data, next)
      .then((result) => next(null, result))
      .catch(next)
}
