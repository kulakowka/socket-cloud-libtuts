'use strict'

module.exports = {
  show (socket) {
    console.log('show')
    socket.on('page:findOne', (data, respond) => {
      console.log('page:findOne', data)
      var page = data.id
      var html = '<h1>' + page + '</h1><p>content</p>'
      socket.emit('page:' + page + ':update', { html })
    })
  }
}
