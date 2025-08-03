// practical-api-mvc-db/models/userModel.js
const sql = require("mssql");
const dbConfig = require("../../dbConfig");
const bcrypt = require("bcrypt");

async function registerUser(userData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    console.log("🧩 Received in model:", userData);

    // Check for missing fields
    if (
      !userData.userId ||
      !userData.fullName ||
      !userData.email ||
      !userData.password ||
      !userData.role
    ) {
      console.log("❌ Missing fields in model:", userData);
      return { success: false, message: "Missing fields" };
    }

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

    // Log before insert
    console.log("📥 Preparing to insert user:", {
      Id: userData.userId,
      Name: userData.fullName,
      Email: userData.email,
      Role: userData.role
    });

    // Insert new user
    const insertQuery = `
      INSERT INTO Users (Id, Name, Email, Password, Role)
      VALUES (@Id, @Name, @Email, @Password, @Role)
    `;

    const request = connection.request();
    request.input("Id", sql.VarChar(10), userData.userId);
    request.input("Name", sql.VarChar(100), userData.fullName);
    request.input("Email", sql.VarChar(100), userData.email);
    request.input("Password", sql.VarChar(255), hashedPassword);
    request.input("Role", sql.VarChar(20), userData.role);

    const result = await request.query(insertQuery);

    if (result.rowsAffected[0] > 0) {
      return { success: true, message: "User registered successfully" };
    } else {
      return { success: false, message: "Insert query ran but no rows affected" };
    }

  } catch (error) {
    console.error("❌ Database error in registerUser:", error);
    return {
      success: false,
      message: error.message || "Unknown error during registration"
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("⚠ Error closing DB connection:", err);
      }
    }
  }
}

async function getProfileById(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("Id", sql.VarChar(10), userId)
      .query(
        `SELECT Id, Name, Email, Role
         FROM Users
         WHERE Id = @Id`
      );
    const row = result.recordset[0];
    if (!row) return null;
    // derive username as fallback
    const username = "@" + (row.Name || "").toLowerCase().replace(/\s+/g, "");
    return {
      userId: row.Id,
      name: row.Name,
      username,
      email: row.Email,
      role: row.Role,
    };
  } catch (err) {
    console.error("❌ Error in getProfileById:", err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch {}
    }
  }
}

module.exports = {
  registerUser,
  getProfileById,
};
