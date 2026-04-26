// ─── CONFIG (no .env file needed) ───────────────────────────────────────────
process.env.MONGODB_URI          = 'mongodb+srv://stmsuser:stms12345@stms.astrbub.mongodb.net/admission_tracker?retryWrites=true&w=majority&appName=STMS';
process.env.JWT_SECRET           = 'admission_tracker_jwt_secret_key_2024';
process.env.REFRESH_TOKEN_SECRET = 'admission_tracker_refresh_secret_key_2024';
process.env.JWT_EXPIRES_IN       = '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
process.env.NODE_ENV             = 'production';
process.env.PORT                 = '3000';
process.env.ALLOWED_ORIGINS      = 'http://localhost:3000';

const express      = require('express');
const mongoose     = require('mongoose');
const cors         = require('cors');
const path         = require('path');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');

// ─── DB ──────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

// ─── APP ─────────────────────────────────────────────────────────────────────
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── RATE LIMITING ───────────────────────────────────────────────────────────
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
const authLimiter    = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many login attempts' } });
app.use(generalLimiter);

// ─── API ROUTES ──────────────────────────────────────────────────────────────
app.use('/api/auth',     authLimiter, require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/notes',    require('./routes/notes'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/reports',  require('./routes/reports'));
app.get('/api/health',   (req, res) => res.json({ status: 'ok' }));

// ─── SERVE REACT FRONTEND ────────────────────────────────────────────────────
const frontendBuild = path.join(__dirname, '../../frontend/build');
app.use(express.static(frontendBuild));
app.get('*', (req, res) => res.sendFile(path.join(frontendBuild, 'index.html')));

// ─── START ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 App running at http://localhost:${PORT}`));

module.exports = app;
