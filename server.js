const express = require("express")
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.static('public'))

app.get('/', (req,res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req,res) => {
    res.render('room', {roomId: req.params.room})
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
    if (!roomId || !userId) {
        console.error("❌ Missing roomId or userId:", roomId, userId)
        return
    }

    console.log(`✅ ${userId} joined room ${roomId}`)
    socket.join(roomId)

    setTimeout(() => {
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


server.listen(3000, () => {
    console.log("Server running at http://localhost:3000")
})
