'use strict'

var { Tutorial, Comment, Language, Project } = require('models')

const Model = Tutorial
const ITEMS = 'tutorials'
const ITEM = 'tutorial'

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

  // Find tutorial comments
  socket.on('get ' + ITEM + '_comments', (data, cb) => {
    getItemComments(data)
    .then((items) => socket.emit('receive ' + ITEM + '_comments', items, cb))
    .catch(cb)
  })

  // Create
  socket.on('create ' + ITEM, (data, cb) => {
    let currentUser = socket.getAuthToken()

    if (!currentUser) return cb('Login please')

    data.authorId = currentUser.id

    // if (data.languages) {
    //   Language.getAll(...data.languages).run().then((languages) => {
    //   })
    // }
    console.log('data', data)

    createItem(data)
    .then((item) => {
      socket.emit(ITEM + ' created', item)
      cb()
    })
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
  return Model.get(data.id).getJoin().execute()
}

function createItem (data) {
  let item = new Model(data)
  return item.saveAll()
}

function updateItem (data) {
  return Model.get(data.id).run().then((item) => {
    return item.merge(data).saveAll()
  })
}

function deleteItem (data) {
  return Model.get(data.id).run().then((item) => {
    return item.delete()
  })
}

function getItemComments (data) {
  const tutorialId = data.id
  return Comment.filter({ tutorialId }).getJoin().execute()
}
