const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import your User model

// NOTE: In a real app, you would use bcrypt for password hashing and comparison.
// We are using a simple string comparison for demonstration.

// Show the Login Form
router.get('/login', (req, res) => {
    // Render the login EJS file (Correct path: views/admin/login.ejs)
    res.render('admin/login', { error: req.flash('error') });
});

// Handle Login Submission
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        // 1. Check if user exists
        if (!user) {
            req.flash('error', 'Authentication failed: Invalid email or password.');
            return res.redirect('/login');
        }

        // 2. Check password (Replace with bcrypt.compare(password, user.password) in production!)
        if (user.password !== password) { 
            req.flash('error', 'Authentication failed: Invalid email or password.');
            return res.redirect('/login');
        }

        // 3. Check Admin Role
        if (user.role !== 'admin') {
            req.flash('error', 'Access Denied: Account is not an administrator.');
            return res.redirect('/login');
        }

        // 4. Successful Admin Login
        
        // **CRITICAL FIX:** Manually set the session user data
        req.session.user = { 
            id: user._id, 
            name: user.name, 
            email: user.email,
            role: user.role 
        };
        
        // **CRITICAL FIX:** Force the session to save before redirecting.
        req.session.save(err => {
            if (err) {
                console.error('Session save error:', err);
                req.flash('error', 'A server error occurred during login.');
                return res.redirect('/login');
            }
            // Redirect to the Admin Dashboard ONLY after session is saved
            res.redirect('/admin/dashboard');
        });

    } catch (err) {
        console.error('Login Error:', err);
        req.flash('error', 'A server error occurred during login.');
        res.redirect('/login');
    }
});

// Handle Logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
        }
        // Redirect to the main page or login page
        res.redirect('/'); 
    });
});


module.exports = router;