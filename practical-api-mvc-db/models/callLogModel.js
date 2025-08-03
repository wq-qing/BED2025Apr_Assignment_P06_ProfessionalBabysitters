// models/callLogModel.js
const sql = require("mssql");

module.exports = {
  async getOpenRooms() {
    const result = await new sql.Request()
      .query("SELECT RoomId FROM dbo.Rooms WHERE Status='open'");
    return result.recordset.map(r => r.RoomId);
  },

  async insertCallStart({ roomId, userId, startTime }) {
    await new sql.Request()
      .input('RoomId', sql.UniqueIdentifier, roomId)
      .input('UserId', sql.NVarChar(20), userId)
      .input('StartTime', sql.BigInt, startTime)
      .query(`
        INSERT INTO CallLogs (RoomId, UserId, StartTime)
        VALUES (@RoomId, @UserId, @StartTime)
      `);
  },

  async getCallStart({ roomId, userId }) {
    const result = await new sql.Request()
      .input('RoomId', sql.UniqueIdentifier, roomId)
      .input('UserId', sql.NVarChar(20), userId)
      .query('SELECT StartTime FROM CallLogs WHERE RoomId=@RoomId AND UserId=@UserId');
    return result.recordset[0] || null;
  },

  async updateCallEnd({ roomId, userId, endTime, duration }) {
    await new sql.Request()
      .input('RoomId', sql.UniqueIdentifier, roomId)
      .input('UserId', sql.NVarChar(20), userId)
      .input('EndTime', sql.BigInt, endTime)
      .input('Duration', sql.Int, duration)
      .query(`
        UPDATE CallLogs
        SET EndTime = @EndTime,
            Duration = @Duration
        WHERE RoomId = @RoomId AND UserId = @UserId
      `);
  },

  async getLogsByUser(userId) {
    const result = await new sql.Request()
      .input('UserId', sql.NVarChar(20), userId)
      .query(`
        SELECT RoomId, StartTime, EndTime, Duration
        FROM CallLogs
        WHERE UserId = @UserId
        ORDER BY StartTime DESC
      `);
    return result.recordset;
  }
};
