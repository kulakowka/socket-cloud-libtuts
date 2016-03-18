// Initiate the connection to the server
var socket = socketCluster.connect({
  hostname: 'localhost',
  port: 8000
})

socket.on('error', function (err) {
  console.log('Socket error - ', err)
})

var PostsList = React.createClass({
  getInitialState () {
    // this.postsUpdate = this.postsUpdate.bind(this)
    // this.postUpdate = this.postUpdate.bind(this)
    // this.postsChanges = socket.subscribe('changes:posts')
    return {
      posts: new Map()
    }
  },

  componentDidMount () {
    socket.on('connect', (status) => {
      console.log('emit => request:posts')
      socket.emit('request_posts')
      socket.on('response:posts', this.postsIndexUpdate)
    // this.postsChanges.watch(this.postUpdate)
    })
  },

  postsIndexUpdate (data, res) {
    console.log('postsIndexUpdate', data)

    var posts = new Map()
    data.forEach((post) => posts.set(post.id, post))
    this.setState({posts})
    res()
  },

  userUpdate (post, res) {
    var posts = this.state.posts
    posts.set(post.id, post)
    this.setState({posts})
    res()
  },

  usersChanges () {},

  componentWillUnmount () {
    socket.off('response:posts', this.postsIndexUpdate)
  // this.postsChanges.unwatch(this.postUpdate)
  },

  render () {
    return (
      <div>
        list
      </div>
    )
  }
})

ReactDOM.render(
  <PostsList />,
  document.getElementById('container')
)
