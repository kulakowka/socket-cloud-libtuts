/* global $, socketCluster*/

var socket = socketCluster.connect()

socket.on('error', onError)
socket.on('connect', onConnect)

// post changes
var postsChanges = socket.subscribe('postsChanges')

postsChanges.on('subscribeFail', subscribeFailed)

postsChanges.watch(postChanged)
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
  
  console.log('login', data)

  if (data.username !== '' && data.password !== '') {
    socket.emit('login', data, function (err) {
      if (err) {
        console.log('showLoginError', err)
        $('#logInForm').show()
        $('#newPostForm').hide()
      } else {
        console.log('goToMainScreen')
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
    socket.emit('postCreate', data, postCreated)
  }
  return false
})

// utils

function onConnect (status) {
  if (status.isAuthenticated) {
    console.log('CONNECTED: is Authenticated', status)
    $('#logInForm').hide()
    $('#newPostForm').show()
  } else {
    $('#logInForm').show()
    $('#newPostForm').hide()
    console.log('CONNECTED: is Guest', status)
  }

  // console.log('get initial posts', {page: 1})
  socket.emit('getPosts', {page: 1})
  socket.on('receivePosts', onReceivePosts)


  $.getJSON('http://faker.hook.io/?property=internet.userName&locale=en', function (text) {
    $('input[name="author"]').val(text)
  })
  $.getJSON('http://faker.hook.io/?property=hacker.phrase&locale=en', function (text) {
    $('textarea[name="text"]').val(text)
  })
}

function onReceivePosts (data, respond) {
  // console.log('receivePosts', data)
  var list = data.map(getPost)
  $('#postsList').html(list)
  respond()
}

function postChanged (data) {
  console.log('postChanged', data)

  var newPost = getPost(data.value)

  if (data.oldValue && data.isSaved) {
    var postItem = $('#postsList').find('#' + data.oldValue.id)

    if (data.oldValue.id === data.value.id) {
      postItem.replaceWith(newPost)
    } else {
      postItem.remove()
      $('#postsList').prepend(newPost)
    }
  } else if (data.isSaved) {
    // console.log('add post', newPost)
    $('#postsList').prepend(newPost)
  } else {
    // console.log('remove post', newPost)
    $('#postsList').find('#' + data.value.id).remove()
  }
}

function getPost (data) {
  var newPost = $('<article></article>')
  newPost.attr('id', data.id)
  var createdAt = $('<span class="createdAt"></span>').text(data.createdAt)
  var html = $('<span class="text markdown-body"></span>').html(data.html)
  var author = $('<b class="author"></b>').text(data.author + ': ')
  newPost.append(author).append(html).append(createdAt)
  return newPost
}

function getFormData (form) {
  var data = $(form).serializeArray()

  return data.reduce(function (res, item) {
    res[item.name] = item.value.trim()
    return res
  }, {})
}

var postId = 1

function postCreated (err) {
  if (err) {
    console.log('postCreateError', err)
  } else {
    postId++
    $.getJSON('http://faker.hook.io/?property=internet.userName&locale=en', function (text) {
      $('input[name="author"]').val(text)
    })
    $.getJSON('http://faker.hook.io/?property=hacker.phrase&locale=en', function (text) {
      $('textarea[name="text"]').val(text)
    })
    $('input[name="author"]').val('')
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
