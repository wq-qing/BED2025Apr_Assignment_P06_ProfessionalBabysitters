app.post('/api/register', async (req, res) => {
  const { userId, fullName, email, password, role } = req.body;
  if (!userId || !fullName || !email || !password || !role) {
    return res.status(400).send('Missing fields');
  }

  try {
    const pool   = await poolPromise;
    const hashed = await bcrypt.hash(password, 10);

    await pool.request()
      .input('Id',       sql.VarChar(10), userId)
      .input('Name',     sql.NVarChar(100), fullName)
      .input('Email',    sql.VarChar(100), email)
      .input('Password', sql.VarChar(255), hashed)
      .input('Role',     sql.VarChar(20),  role)
      .query(`
        INSERT INTO Users (Id, Name, Email, Password, Role)
        VALUES (@Id, @Name, @Email, @Password, @Role)
      `);

    res.status(201).send('User registered');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});