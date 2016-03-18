/* global $, socketCluster*/

var socket = socketCluster.connect()

socket.on('error', onError)
socket.on('connect', onConnect)

// post changes
var tutorialsChanges = socket.subscribe('tutorialsChanges')

tutorialsChanges.on('subscribeFail', subscribeFailed)

tutorialsChanges.watch(tutorialChanged)

$('#logout').on('click', function () {
  socket.deauthenticate(function (err) {
    if (err) {
      console.log('show deauthenticate Error', err)
    }
    $('#logInForm').show()
    $('#newPostForm').hide()
  })
  return false
})

$('#logInForm').on('submit', function () {
  var data = getFormData(this)

  // console.log('login', data)

  if (data.username !== '' && data.password !== '') {
    socket.emit('login', data, function (err) {
      if (err) {
        console.log('showLoginError', err)
        $('#logInForm').show()
        $('#newPostForm').hide()
      } else {
        // console.log('goToMainScreen')
        $('#logInForm').hide()
        $('#newPostForm').show()
      }
    })
  }
  return false
})
$('#newPostForm').on('submit', function () {
  var data = getFormData(this)

  if (data.text !== '' && data.author !== '') {
    socket.emit('tutorialCreate', data, tutorialCreated)
  }
  return false
})

// utils

function onConnect (status) {
  if (status.isAuthenticated) {
    console.log('CONNECTED: is Authenticated', status)
    $('#logInForm').hide()
    $('#newPostForm').show()
    $('#username').text(socket.getAuthToken().username || '')
  } else {
    $('#logInForm').show()
    $('#newPostForm').hide()
    console.log('CONNECTED: is Guest', status)
  }

  // console.log('get initial posts', {page: 1})
  socket.emit('getTutorials', {page: 1})
  socket.on('receiveTutorials', onReceiveTutorials)

  $.getJSON('http://faker.hook.io/?property=lorem.paragraphs&locale=en', function (text) {
    $('textarea[name="text"]').val(text)
  })
}

function onReceiveTutorials (data, respond) {
  // console.log('receivePosts', data)
  var list = data.map(getTutorial)
  $('#postsList').html(list)
  respond()
}

function tutorialChanged (data) {
  // console.log('tutorialChanged', data)

  var newTutorial = getTutorial(data.value)

  if (data.oldValue && data.isSaved) {
    var tutorialItem = $('#postsList').find('#' + data.oldValue.id)

    if (data.oldValue.id === data.value.id) {
      tutorialItem.replaceWith(newTutorial)
    } else {
      tutorialItem.remove()
      $('#postsList').prepend(newTutorial)
    }
  } else if (data.isSaved) {
    // console.log('add post', newPost)
    $('#postsList').prepend(newTutorial)
  } else {
    // console.log('remove post', newPost)
    $('#postsList').find('#' + data.value.id).remove()
  }
}

function getTutorial (data) {
  // console.log('getTutorial', data)
  var newTutorial = $('<article></article>')
  newTutorial.attr('id', data.id)
  var createdAt = $('<span class="createdAt"></span>').text(data.createdAt)
  var title = $('<h2></h2>').text(data.title)
  var html = $('<span class="text markdown-body"></span>').html(data.contentHtml)
  var author = $('<b class="author"></b>').text(data.author.username + ': ')
  if (socket.getAuthToken() && socket.getAuthToken().id === data.author.id) author.addClass('me')
  newTutorial.append(author).append(title).append(html).append(createdAt)
  return newTutorial
}

function getFormData (form) {
  var data = $(form).serializeArray()

  return data.reduce(function (res, item) {
    res[item.name] = item.value.trim()
    return res
  }, {})
}

var postId = 1

function tutorialCreated (err) {
  if (err) {
    console.log('tutorialCreateError', err)
  } else {
    postId++
    $.getJSON('http://faker.hook.io/?property=lorem.paragraphs&locale=en', function (text) {
      $('textarea[name="text"]').val(text)
    })
    $('textarea[name="text"]').val('')
  }
}

function subscribeFailed (err) {
  console.log('Failed to subscribe to the "user/changes" channel due to error: ' + err)
}

function onError (err) {
  // alert('Чатик больше не работает! Что-то сломалось!!!11!!111!')
  console.log('Socket error - ', err)
}
