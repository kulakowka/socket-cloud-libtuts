'use strict'

var co = require('co')
var marked = require('marked')
var thinky = require('utils/thinky')
var type = thinky.type
var r = thinky.r
var Tutorial = require('./tutorial')
var User = require('./user')
var emoji = require('emoji-parser')
var highlightjs = require('highlight.js')

// keep emoji-images in sync with the official repository
emoji.init().update()

marked.setOptions({
  // renderer: new marked.Renderer(),
  gfm: true,
  tables: false,
  breaks: true,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false,
  highlight: function (code, lang, callback) {
    return highlightjs.highlightAuto(code).value
  }
})

var Comment = thinky.createModel('Comment', {
  id: type.string(),
  content: type.string(),
  contentHtml: type.string(),
  createdAt: type.date().default(r.now()),
  updatedAt: type.date().default(r.now())
  // authorId => User
  // tutorialId => Tutorial
})

// marked content
Comment.pre('save', function (next) {
  if (this.content) this.contentHtml = emoji.parse(marked(this.content), 'http://localhost:8000/emoji/images')
  next()
})

Comment.post('save', function (next) {
  const tutorialId = this.tutorialId
  const authorId = this.authorId
  co(function * () {
    // increment comments count
    yield Tutorial.get(tutorialId).update({commentsCount: r.row('commentsCount').add(1)}).run()
    yield User.get(authorId).update({commentsCount: r.row('commentsCount').add(1)}).run()
  })
  .then((value) => next())
  .catch(next)
})

Comment.post('delete', function (next) {
  const tutorialId = this.tutorialId
  const authorId = this.authorId
  co(function* () {
    // decrement comments count
    yield Tutorial.get(tutorialId).update({commentsCount: r.row('commentsCount').add(-1)}).run()
    yield User.get(authorId).update({commentsCount: r.row('commentsCount').add(-1)}).run()
  })
  .then((value) => next())
  .catch(next)
})

module.exports = Comment
