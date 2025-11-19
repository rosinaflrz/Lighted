const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

// Librería de google para auth
const { OAuth2Client } = require('google-auth-library');

const { authMiddleware } = require('./middleware/auth');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Helper para buscar usuario por email
function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, email, password_hash FROM users WHERE email = ?',
      [email],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password || password.length < 8) {
    return res.status(400).json({ message: 'Email and password (8+ chars) are required' });
  }
  try {
    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash],
      function (err) {
        if (err) return res.status(500).json({ message: 'Error creating user' });
        const user = { id: this.lastID, email };
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(201).json({ user, token });
      }
    );
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) return res.status(400).json({ message: 'No token provided' });

  try {
    // 1. Verificar el token con google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    if (!email) return res.status(400).json({ message: 'Invalid Google Token' });

    // 2. buscar o crear usuario
    let user = await findUserByEmail(email);

    if (!user) {
      // crear usuario con password aleatorio
      const randomPass = await bcrypt.hash(Date.now().toString() + 'google', 10);
      
      await new Promise((resolve, reject) => {
        db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, randomPass], function(err) {
          if (err) reject(err);
          else {
            user = { id: this.lastID, email };
            resolve(true);
          }
        });
      });
    }

    // 3. Generar JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, email: user.email }, token });

  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ message: 'Google authentication failed' });
  }
});

// PUT /api/auth/password (cambiar passw)
router.put('/password', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: "New password must be 8+ chars" });
  }

  try {
    db.get('SELECT password_hash FROM users WHERE id = ?', [userId], async (err, row) => {
      if (err || !row) return res.status(404).json({ message: "User not found" });
      const valid = await bcrypt.compare(currentPassword, row.password_hash);
      if (!valid) return res.status(401).json({ message: "Current password is wrong" });

      const newHash = await bcrypt.hash(newPassword, 10);
      db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId], (err) => {
        if (err) return res.status(500).json({ message: "Error updating password" });
        res.json({ message: "Password updated successfully" });
      });
    });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

// DELETE /api/auth/account (eliminar cuenta)
router.delete('/account', authMiddleware, (req, res) => {
  const userId = req.user.id;
  db.run('DELETE FROM projects WHERE user_id = ?', [userId], (err) => {
    if (err) console.error("Error deleting projects", err);
    db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
      if (err) return res.status(500).json({ message: "Error deleting account" });
      res.json({ message: "Account deleted" });
    });
  });
});

module.exports = router;