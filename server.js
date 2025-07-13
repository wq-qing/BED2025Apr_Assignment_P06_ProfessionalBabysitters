const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const { ExpressPeerServer } = require('peer')

app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.static('public'))
app.use(express.json())


const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs'
})
app.use('/peerjs', peerServer)

// Jayden's sample API
const posts = [
  { username: 'Kyle', title: 'Post 1' },
  { username: 'Jim', title: 'Post 2' }
]
app.get('/posts', (req, res) => {
  res.json(posts)
})

app.post('/login',(req,res) => {
  // Authenticate User

  const username = req.body.username
  const user = { name: username }

  
})

// Routes
app.get('/', (req, res) => {
  res.redirect('/main-room') // Hardcoded room for now
})
app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})



// Socket.io handling
io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).emit('user-connected', userId)
    console.log('User connected:', userId)

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId)
    })
  })
})

// Start server
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})
