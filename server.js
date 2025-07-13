//Jay
require('dotenv').config();

const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const { ExpressPeerServer } = require('peer')
const jwt = require('jsonwebtoken');

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


app.get('/posts', authenticateToken, (req, res) => {
  res.json(posts.filter(post => post.username === req.user.name))
})

let refreshTokens = []

app.post('/token', (req,res) => {
  const refreshToken = req.body.token
  if (refreshToken == null ) return res.sendStatus(401)
  if (refreshTokens.includes(refreshToken)) return res.sendStatus(403)
  jwt.verify(refreshToken, process,env.REFRESH_TOKEN_SECRET, (err,user) => {
    if (err) return res.sendStatus(403)
      const accessToken = generateAccessToken({ name: user.name })
    res.json({ accessToken: accessToken })
  })
})

//Authentication 
app.delete('/logout', (req,res) => {
  refreshTokens = refreshTokens.filter(token => token !== req.body.token)
  res.sendStatus(204)
})
app.post('/login',(req,res) => {
  // Authenticate User

  const username = req.body.username
  const user = { name: username }

  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
  res.json({ accessToken: accessToken, refreshToken: refreshToken })

})

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m'})
}
// Routes
app.get('/', (req, res) => {
  res.redirect('/main-room') // Hardcoded room for now
})
app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

//Jay
function authenticateToken(req,res,next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

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
