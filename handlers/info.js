'use strict'

module.exports = {
  show (socket) {
    socket.on('page:findOne', (data, respond) => {
      var page = data.id
      var html = '<h1>' + page + '</h1><p>content</p>'
      socket.emit('page:' + page + ':update', { html })
    })
  }
}
