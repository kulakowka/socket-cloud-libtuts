'use strict'

var { User } = require('models')

const Model = User
const ITEMS = 'users'
const ITEM = 'user'

module.exports = function onConnection (socket) {
  // Find all
  socket.on('get ' + ITEMS, (data, cb) => {
    getItems(data)
    .then((items) => socket.emit('receive ' + ITEMS, items, cb))
    .catch(cb)
  })

  // Find one
  socket.on('get ' + ITEM, (data, cb) => {
    getItem(data)
    .then((item) => socket.emit('receive ' + ITEM, item, cb))
    .catch(cb)
  })

  // Create
  socket.on('create ' + ITEM, (data, cb) => {
    createItem(data)
    .then((item) => socket.emit(ITEM + ' created', item, cb))
    .catch(cb)
  })

  // Update
  socket.on('update ' + ITEM, (data, cb) => {
    updateItem(data)
    .then((item) => socket.emit(ITEM + ' updated', item, cb))
    .catch(cb)
  })

  // Delete
  socket.on('delete ' + ITEM, (data, cb) => {
    deleteItem(data)
    .then((item) => socket.emit(ITEM + ' deleted', item, cb))
    .catch(cb)
  })
}

function getItems (data) {
  return Model.getJoin().execute()
}

function getItem (data) {
  const username = data.username
  return Model.filter({ username }).getJoin().execute().then((items) => items.pop())
}

function createItem (data) {
  let item = new Model(data)
  return item.saveAll()
}

function updateItem (data) {
  const username = data.username
  return Model.filter({ username }).getJoin().execute().then((items) => items.pop()).then((item) => {
    return item.merge(data).saveAll()
  })
}

function deleteItem (data) {
  const username = data.username
  return Model.filter({ username }).getJoin().execute().then((items) => items.pop()).then((item) => {
    return item.delete()
  })
}
