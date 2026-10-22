const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' });
};

// 1. Register User
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'cashier',
    });

    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
};

// 2. Login User
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Login error: ' + err.message });
  }
};

// 3. Get Current User (Me)
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// 4. Seed default demo accounts
const seedUsers = async (req, res) => {
  try {
    const existing = await User.countDocuments();
    if (existing > 0) {
      return res.json({ message: `Users already seeded (${existing} accounts present).` });
    }

    const demoUsers = [
      { name: 'Karthikeyan (Admin)', email: 'admin@stockpilot.io', password: 'Password123!', role: 'admin' },
      { name: 'Store Manager', email: 'manager@stockpilot.io', password: 'Password123!', role: 'manager' },
      { name: 'Front Desk Cashier', email: 'cashier@stockpilot.io', password: 'Password123!', role: 'cashier' },
    ];

    for (const u of demoUsers) {
      const newUser = new User(u);
      await newUser.save();
    }

    res.status(201).json({
      message: 'Default StockPilot demo accounts created successfully.',
      accounts: demoUsers.map((u) => ({ email: u.email, role: u.role, password: u.password })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Seeding users failed: ' + err.message });
  }
};

module.exports = { register, login, getMe, seedUsers };
