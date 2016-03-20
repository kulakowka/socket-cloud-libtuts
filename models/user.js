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

// let pswd = 'ak87c210xx'

// bcrypt.genSalt(10, (err, salt) => {
//   if (err) return console.log(err)

//   bcrypt.hash(pswd, salt, (err, hash) => {
//     if (err) return console.log(err)

//     bcrypt.compare(pswd, hash, (err, valid) => {
//       if (err) return console.log(err)

//       console.log('bcrypt')
//       console.log('pswd:', pswd)
//       console.log('salt:', salt)
//       console.log('hash:', hash)
//       console.log('valid:', valid)
//     })
//   })
// })

/**
 * Методы экземпляра модеи
 * account.checkPassword()
 */
User.define('checkPassword', function (password, callback) {
  // console.log('checkPassword', password, this.password)
  // if (this.password === password) return callback(null, true)
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
  // console.log('save user')
  // console.log('getOldValue:', this.getOldValue())
  // console.log('isSaved:', this.isSaved())
  // console.log('this:', this)

  if (!this.password) return next()
  if (this.isSaved()) return next()  // если редактирование - то пропускаем (иначе он каждый раз будет сам себя перезатирать при каждом обновлении)

  // console.log('save user 2')

  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err)
    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) return next(err)
      console.log('PASSWORD UPDATED', hash)
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
