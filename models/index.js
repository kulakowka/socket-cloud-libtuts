'use strict'

var Comment = require('models/comment')
var Language = require('models/language')
var Project = require('models/project')
var Tutorial = require('models/tutorial')
var User = require('models/user')

Comment.belongsTo(User, 'author', 'authorId', 'id')
Comment.belongsTo(Tutorial, 'tutorial', 'tutorialId', 'id')

Language.belongsTo(User, 'author', 'authorId', 'id')
Language.hasAndBelongsToMany(Tutorial, 'tutorials', 'id', 'id')

Project.belongsTo(User, 'author', 'authorId', 'id')
Project.hasAndBelongsToMany(Tutorial, 'tutorials', 'id', 'id')
Project.hasAndBelongsToMany(Language, 'languages', 'id', 'id')

Tutorial.belongsTo(User, 'author', 'authorId', 'id')
Tutorial.hasAndBelongsToMany(Language, 'languages', 'id', 'id')
Tutorial.hasAndBelongsToMany(Project, 'projects', 'id', 'id')

module.exports = {
  Comment,
  Language,
  Project,
  Tutorial,
  User
}
