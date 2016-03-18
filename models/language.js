
'use strict'

var slug = require('slug')
var thinky = require('utils/thinky')
var type = thinky.type
var r = thinky.r

var Language = thinky.createModel('Language', {
  id: type.string(),
  name: type.string(),
  slug: type.string(),
  createdAt: type.date().default(r.now()),
  updatedAt: type.date().default(r.now()),
  projectsCount: type.number().default(0),
  tutorialsCount: type.number().default(0)
  // authorId => User
  // tutorials => [Tutorial, Tutorial]
})

Language.ensureIndex('slug')

// marked content
Language.pre('save', function (next) {
  let name = this.name.replace(/\+/g, 'p').replace(/\#/g, 'sharp')
  this.slug = slug(name).toLowerCase()
  next()
})

module.exports = Language
