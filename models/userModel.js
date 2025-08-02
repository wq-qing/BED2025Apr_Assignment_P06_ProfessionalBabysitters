const sql = require("mssql");
const dbConfig = require("../dbConfig");
const bcrypt = require("bcrypt");

async function registerUser(userData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    
    // Check if user already exists
    const checkUserQuery = `SELECT COUNT(*) as count FROM Users WHERE Id = @Id OR Email = @Email`;
    const checkRequest = connection.request();
    checkRequest.input("Id", sql.VarChar(10), userData.userId);
    checkRequest.input("Email", sql.VarChar(100), userData.email);
    const checkResult = await checkRequest.query(checkUserQuery);
    
    if (checkResult.recordset[0].count > 0) {
      return { success: false, message: "User already exists with this ID or email" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Insert new user
    const insertQuery = `
      INSERT INTO Users (Id, FullName, Email, Password, Role)
      VALUES (@Id, @FullName, @Email, @Password, @Role)
    `;
    
    const request = connection.request();
    request.input("Id", sql.VarChar(10), userData.userId);
    request.input("FullName", sql.VarChar(100), userData.fullName);
    request.input("Email", sql.VarChar(100), userData.email);
    request.input("Password", sql.VarChar(255), hashedPassword);
    request.input("Role", sql.VarChar(20), userData.role);
    
    const result = await request.query(insertQuery);
    
    if (result.rowsAffected[0] > 0) {
      return { success: true, message: "User registered successfully" };
    } else {
      return { success: false, message: "Failed to register user" };
    }
    
  } catch (error) {
    console.error("Database error in registerUser:", error);
    if (error.number === 2627) { // SQL Server duplicate key error
      return { success: false, message: "User already exists" };
    }
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection in registerUser:", err);
      }
    }
  }
}

module.exports = {
  registerUser
};