const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ===== REGISTER =====
// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password before saving — never store plain text passwords
    // The "10" is the salt rounds — higher = more secure but slower
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });
    await user.save();

    // Create a JWT token for the new user so they're logged in immediately
    const token = jwt.sign(
      { userId: user._id, username: user.username }, // Payload — data stored in the token
      process.env.JWT_SECRET,                         // Secret key to sign the token
      { expiresIn: '7d' }                             // Token expires in 7 days
    );

    res.status(201).json({ token, username: user.username });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ===== LOGIN =====
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare the entered password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create and return a JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, username: user.username });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
