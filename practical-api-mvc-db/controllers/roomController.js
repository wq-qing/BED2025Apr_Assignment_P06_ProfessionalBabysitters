// controllers/roomController.js
const { v4: uuidV4 } = require('uuid');
const roomModel = require('../models/roomModel');

exports.joinRoom = async (req, res) => {
  const roomId = req.params.roomId;
  try {
    await roomModel.markInUse(roomId);
    console.log('→ Room marked in use');
    res.redirect(`/room/${roomId}`);
  } catch (err) {
    console.error('❌ Error joining room:', err);
    res.status(500).send('Could not join room');
  }
};

exports.createRoom = async (req, res) => {
  const { doctorId } = req.body;
  if (!doctorId || !doctorId.startsWith('D')) {
    return res.status(400).json({ error: 'Invalid doctorId' });
  }
  const roomId = uuidV4().toLowerCase();
  try {
    await roomModel.createRoom({ roomId, doctorId });
    console.log('Inserted room:', roomId, 'for', doctorId);
    return res.json({ roomId });
  } catch (err) {
    console.error('❌ Error creating room:', err);
    return res.status(500).json({ error: 'Could not create room' });
  }
};

exports.deleteRoom = async (req, res) => {
  const { roomId } = req.params;
  console.log('DELETE /rooms/' + roomId);
  try {
    await roomModel.closeRoom(roomId);
    console.log('→ Room marked closed (soft-deleted)');
    return res.sendStatus(204);
  } catch (err) {
    console.error('❌ Error in DELETE /rooms/:roomId:', err);
    return res.sendStatus(500);
  }
};
