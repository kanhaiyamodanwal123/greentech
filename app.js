const MongoStore = require('connect-mongo'); // REQUIRED: To store sessions in MongoDB Atlas
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
// It is critical to ensure connectDB() is called in your environment startup script.
// Assuming the environment handles the connection based on your configuration.
// connectDB(); 

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

// ==========================
// Body Parser
// ==========================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Method Override (for PUT/DELETE forms)
app.use(methodOverride('_method'));

// Timeout Middleware (Kept for upload stability)
app.use((req, res, next) => {
    if (req.originalUrl.includes('/vehicles/add') || req.originalUrl.includes('/vehicles/edit')) {
        // Set timeout to 5 minutes (300,000 ms)
        req.setTimeout(300000); 
    }
    next();
});

// ==========================
// *** FIX: EXPRESS SESSION (Using MongoStore for Persistence) ***
// This uses your MONGO_URI to store sessions persistently in Atlas
// ==========================
const sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // Uses the Atlas URI from your .env
    collectionName: 'sessions', 
    ttl: 14 * 24 * 60 * 60, // 14 days
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_bike_key',
  resave: false,
  saveUninitialized: false,
  store: sessionStore, // *** USING MONGODB FOR SESSIONS ***
  cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      secure: true, // IMPORTANT: Must be TRUE for HTTPS environment (Render)
      httpOnly: true,
  }
}));

// ==========================
// Passport Middleware
// ==========================
app.use(passport.initialize());
app.use(passport.session());

// ==========================
// Flash Messages
// ==========================
app.use(flash());

// ==========================
// Custom Session/User Middleware
// ==========================
app.use((req, res, next) => {
    if (req.session.user) {
        req.user = req.session.user; 
    }
    
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error'); 
    res.locals.user = req.user || null; 
    
    next();
});

// ==========================
// Routes
// ==========================
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/vehicles', require('./routes/vehicles'));
app.use('/bookings', require('./routes/bookings'));

app.use('/', authRoutes);
app.use('/', adminRoutes); 

// ==========================
// 404 Handler
// ==========================
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// ==========================
// GLOBAL ERROR HANDLER
// ==========================
app.use((err, req, res, next) => {
  console.error("Global Error Handler Caught:", err.message);
  
  if (err && err.message) {
    req.flash('error_msg', `Upload Failed: ${err.message}. Please check credentials and file types.`);
  } else {
    req.flash('error_msg', 'An unexpected error occurred.');
  }
  
  if (req.originalUrl && req.originalUrl.includes('/vehicles/add')) {
    return res.redirect('/vehicles/add');
  }
  if (req.originalUrl && req.originalUrl.includes('/vehicles/edit')) {
    return res.redirect(req.originalUrl);
  }
  
  res.redirect('/');
});


// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
