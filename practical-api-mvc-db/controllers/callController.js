// controllers/callController.js
const { v4: uuidV4 } = require('uuid');
const callLogModel = require('../models/callLogModel');
const roomModel = require('../models/roomModel');

exports.getOpenRooms = async (req, res) => {
  try {
    const roomIds = await callLogModel.getOpenRooms();
    res.json(roomIds);
  } catch (err) {
    console.error('❌ Error fetching open rooms:', err);
    res.status(500).json([]);
  }
};

exports.logCallStart = async (req, res) => {
  const { roomId, userId, startTime } = req.body;
  try {
    await callLogModel.insertCallStart({ roomId, userId, startTime });
    res.sendStatus(201);
  } catch (err) {
    console.error('❌ Error logging call start:', err);
    res.status(500).send('Failed to log start');
  }
};

exports.logCallEnd = async (req, res) => {
  const { roomId, userId, endTime } = req.body;

  console.log('📩 logCallEnd received:', { roomId, userId, endTime });

  if (!roomId || !userId || !endTime) {
    console.log('❌ Missing fields in request');
    return res.status(400).send('Missing fields');
  }

  try {
    const startRecord = await callLogModel.getCallStart({ roomId, userId });

    if (!startRecord) {
      console.log('❌ No call record found for update');
      return res.status(404).send('No call record found');
    }

    const startTime = startRecord.StartTime;
    const duration = Math.floor((endTime - startTime) / 1000); // seconds

    console.log('🕒 Logging end:', { startTime, endTime, duration });

    await callLogModel.updateCallEnd({
      roomId,
      userId,
      endTime,
      duration
    });

    console.log('✅ Call ended and logged');
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ SQL error in logCallEnd:', err);
    res.status(500).send('Server error');
  }
};

exports.getCallLogs = async (req, res) => {
  const { userId } = req.params;
  try {
    const logs = await callLogModel.getLogsByUser(userId);
    res.json(logs);
  } catch (err) {
    console.error('❌ Error fetching call logs:', err);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
};
