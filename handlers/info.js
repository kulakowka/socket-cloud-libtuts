'use strict'

const ITEM = 'page'

module.exports = function onConnection (socket) {
  // Find one
  socket.on('get ' + ITEM, (data, cb) => {
    getItem(data)
    .then((item) => socket.emit('receive ' + ITEM, item, cb))
    .catch(cb)
  })
}

function getItem (data) {
  var page = data.page
  var html = '<h1>' + page + '</h1><p>content</p>'
  return Promise.resolve({ html })
}
