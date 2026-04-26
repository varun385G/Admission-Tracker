const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { logAudit } = require('../utils/logger');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({ error: `Account locked. Try again in ${mins} minute(s)` });
    }

    if (!user.is_active) return res.status(401).json({ error: 'Account is deactivated' });

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      const attempts = user.failed_login_attempts + 1;
      const update = { failed_login_attempts: attempts };
      if (attempts >= 5) update.locked_until = new Date(Date.now() + 30 * 60 * 1000);
      await User.findByIdAndUpdate(user._id, update);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await User.findByIdAndUpdate(user._id, { failed_login_attempts: 0, locked_until: null });

    const { accessToken, refreshToken } = generateTokens(user._id.toString());
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await RefreshToken.create({
      user_id: user._id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setRefreshCookie(res, refreshToken);
    await logAudit({ user_id: user._id, action: 'LOGIN', entity_type: 'user', entity_id: user._id, ip_address: ip });

    res.json({
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token required' });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const stored = await RefreshToken.findOne({ token_hash: tokenHash, user_id: decoded.userId });

    if (!stored || stored.expires_at < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.is_active) return res.status(401).json({ error: 'User inactive' });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id.toString());
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await RefreshToken.findByIdAndDelete(stored._id);
    await RefreshToken.create({
      user_id: user._id,
      token_hash: newHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setRefreshCookie(res, newRefreshToken);

    res.json({
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await RefreshToken.deleteOne({ token_hash: tokenHash });
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
};

const me = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { login, refresh, logout, me };