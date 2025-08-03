// models/roomModel.js
const { poolPromise, sql } = require("../../dbConfig"); // adjust path if needed

module.exports = {
  async markInUse(roomId) {
    const pool = await poolPromise;
    await pool.request()
      .input('RoomId', sql.UniqueIdentifier, roomId)
      .query("UPDATE dbo.Rooms SET Status='in use' WHERE RoomId=@RoomId");
  },

  async createRoom({ roomId, doctorId }) {
    const pool = await poolPromise;
    await pool.request()
      .input('RoomId', sql.UniqueIdentifier, roomId)
      .input('DoctorId', sql.NVarChar(20), doctorId)
      .query("INSERT INTO dbo.Rooms (RoomId, DoctorId, Status) VALUES (@RoomId,@DoctorId,'open')");
  },

  async closeRoom(roomId) {
    const pool = await poolPromise;
    await pool.request()
      .input('RoomId', sql.UniqueIdentifier, roomId)
      .query("UPDATE dbo.Rooms SET Status='closed' WHERE RoomId=@RoomId");
  }
};
