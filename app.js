require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const methodOverride = require('method-override');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const connectDB = require('./config/db');
const app = express();


// ==========================
// Database Connection
// ==========================
connectDB();

// ==========================
// Passport Config
// ==========================
require('./config/passport')(passport);

// ==========================
// View Engine (EJS)
// ==========================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==========================
// Static Files
// ==========================
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // CRITICAL for document review

// ==========================
// Body Parser
// ==========================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Method Override (for PUT/DELETE forms)
app.use(methodOverride('_method'));

// ==========================
// Express Session (Consolidated setup - Removed second instance)
// ==========================
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_bike_key', // Use environment variable
  resave: false,
  saveUninitialized: false,
  // Note: We use the first session initialization and removed the confusing second one.
}));

// ==========================
// Passport Middleware (Keep this structure)
// ==========================
app.use(passport.initialize());
app.use(passport.session());

// ==========================
// Flash Messages (Consolidated setup - Removed second instance)
// ==========================
app.use(flash());

// ==========================
// Custom Session/User Middleware (CRITICAL FIX)
// This maps our manually set req.session.user (from authRoutes.js) to req.user.
// This ensures the isAdmin middleware works correctly.
// ==========================
app.use((req, res, next) => {
    // If we manually set req.session.user in authRoutes, make sure it's available as req.user
    if (req.session.user) {
        req.user = req.session.user; 
    }
    
    // Set global variables for views using the standard Express/Passport properties
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error'); // Used for login error messages
    res.locals.user = req.user || null; // Makes user object available in EJS
    
    next();
});

// ==========================
// Routes
// ==========================
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/vehicles', require('./routes/vehicles'));
app.use('/bookings', require('./routes/bookings'));


// Authentication and Admin Routes MUST come after user/session setup
app.use('/', authRoutes);
app.use('/', adminRoutes); 

// ==========================
// 404 Handler
// ==========================
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));


