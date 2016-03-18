/* global $, socketCluster*/

var socket = socketCluster.connect()

socket.on('error', onError)
socket.on('connect', onConnect)

// post changes
var postsChanges = socket.subscribe('postsChanges')

postsChanges.on('subscribeFail', subscribeFailed)

postsChanges.watch(postChanged)

$('#newPostForm').on('submit', function () {
  var data = getPostData(this)
  socket.emit('postCreate', data, postCreated)
  return false
})

// utils

function onConnect (status) {
  if (status.isAuthenticated) {
    console.log('CONNECTED: is Authenticated', status)
  } else {
    console.log('CONNECTED: is Guest', status)
  }

  // console.log('get initial posts', {page: 1})
  socket.emit('getPosts', {page: 1})
  socket.on('receivePosts', onReceivePosts)
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
  var text = $('<span class="text"></span>').text(data.text)
  var author = $('<b class="author"></b>').text(data.author + ': ')
  newPost.append(author).append(text).append(createdAt)
  return newPost
}

function getPostData (form) {
  var data = $(form).serializeArray()

  return data.reduce(function (res, item) {
    res[item.name] = item.value
    return res
  }, {})
}

var postId = 1

function postCreated (err) {
  if (err) {
    console.log('postCreateError', err)
  } else {
    postId++
    $('input[name="title"]').val('Post ' + postId)
    $('textarea[name="text"]').val('Text ' + postId)
  }
}

function subscribeFailed (err) {
  console.log('Failed to subscribe to the "user/changes" channel due to error: ' + err)
}

function onError (err) {
  console.log('Socket error - ', err)
}
