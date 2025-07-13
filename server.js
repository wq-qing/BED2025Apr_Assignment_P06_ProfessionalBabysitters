const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
// const { v4: uuidV4 } = require('uuid') [use for multiple rooms]
// const { ExpressPeerServer } = require('peer');

app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.static('public'))
app.use(express.json())

// app.get('/', (req,res) => {
//     res.redirect(`/${uuidV4()}`)
// })

app.get('/', (req, res) => {
  res.redirect('/main-room') //hardcoded for now
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

// Socket.io
io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
    if (!roomId || !userId) {
        console.error("❌ Missing roomId or userId:", roomId, userId)
        return
    }

    console.log(`✅ ${userId} joined room ${roomId}`) //console logs to test if a new user is being logged
    socket.join(roomId)

    setTimeout(() => { //it keeps trying to broadcast a room before the socket has actually joined it
        try {
            socket.to(roomId).emit('user-connected', userId)
        } catch (e) {
            console.error("❌ Failed to emit user-connected:", e)
        }
    }, 100)

    socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', userId)
    })
})

})

const PORT = process.env.PORT || 3000 // deafults to this for local, uses other port from other servers to run when
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
