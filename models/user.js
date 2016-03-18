'use strict'

var thinky = require('utils/thinky')
var type = thinky.type
var r = thinky.r
var ValidationError = thinky.Errors.ValidationError
var bcrypt = require('bcrypt')

var User = thinky.createModel('User', {
  id: type.string(),
  username: type.string(),
  fullName: type.string().default(() => this.username),
  email: type.string(),
  password: type.string(),
  createdAt: type.date().default(r.now()),
  updatedAt: type.date().default(r.now()),
  projectsCount: type.number().default(0),
  languagesCount: type.number().default(0),
  tutorialsCount: type.number().default(0),
  commentsCount: type.number().default(0),
  role: {
    admin: type.boolean(),
    editor: type.boolean(),
    commentator: type.boolean(),
    newbie: type.boolean()
  }
})

User.ensureIndex('updatedAt')
User.ensureIndex('email')
User.ensureIndex('username')

// User.pre('save', function (next) {
//   User.filter({
//     email: this.email
//   })
//   .count()
//   .execute()
//   .then((count) => {
//     if (count) return next(new ValidationError('Email is invalid or already taken.'))
//     next()
//   })
//   .catch(next)
// })

/**
 * Методы экземпляра модеи
 * account.checkPassword()
 */
User.define('checkPassword', function (password, callback) {
  bcrypt.compare(password, this.password, callback)
})

// Add newbie role
User.pre('save', function (next) {
  if (this.role && this.role.newbie) return next()
  this.merge({
    role: {
      newbie: true
    }
  })
  next()
})

// Encrypt password
User.pre('save', function (next) {
  if (!this.password) return next()
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err)
    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) return next(err)
      this.password = hash
      next()
    })
  })
})

User.post('save', function (next) {
  // const old = this.getOldValue()
  // const fullNameChanged = this.fullName !== old.fullName
  // const usernameChanged = this.username !== old.username
  // if (fullNameChanged || usernameChanged) {
  //   console.log('create queue for "user update info" event')
  //   // Поставим задание в очередь - обновить все записи в котрых вставлен автор в виде документа а не только айдишник.
  // }
  next()
})

module.exports = User
