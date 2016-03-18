
'use strict'

var co = require('co')
var marked = require('marked')
var thinky = require('utils/thinky')
var type = thinky.type
var r = thinky.r
var User = require('models/user')

var Tutorial = thinky.createModel('Tutorial', {
  id: type.string(),
  title: type.string(),
  content: type.string(),
  contentHtml: type.string(),
  commentsCount: type.number().default(0),
  createdAt: type.date().default(r.now()),
  updatedAt: type.date().default(r.now())
  // authorId => User
  // languages => [Language, Language]
  // projects => [Project, Project]
})

Tutorial.ensureIndex('createdAt')

// marked content
Tutorial.pre('save', function (next) {
  if (this.content) this.contentHtml = marked(this.content)
  next()
})

Tutorial.post('save', function (next) {
  const authorId = this.authorId
  co(function * () {
    // increment tutorials count
    yield User.get(authorId).update({tutorialsCount: r.row('tutorialsCount').add(1)}).run()
  })
  .then((value) => next())
  .catch(next)
})

Tutorial.post('delete', function (next) {
  const authorId = this.authorId
  co(function * () {
    // decrement tutorials count
    yield User.get(authorId).update({tutorialsCount: r.row('tutorialsCount').add(-1)}).run()
  })
  .then((value) => next())
  .catch(next)
})

module.exports = Tutorial
