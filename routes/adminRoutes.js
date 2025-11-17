const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const Booking = require('../models/Booking'); 
const Vehicle = require('../models/Vehicle'); // Vehicle model import is needed

// Middleware to ensure user is an Admin
const isAdmin = (req, res, next) => {
    // CRITICAL CHECK: Check the session user object
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        req.flash('error', 'Access Denied: You must be an administrator.');
        res.redirect('/login'); // Redirect to login for a better UX
    }
};

// --- RENDER DASHBOARD ---
router.get('/admin/dashboard', isAdmin, async (req, res) => {
    // Initialize variables to ensure they exist for res.render() in case of error
    let unverifiedUsers = []; 
    let recentBookings = [];
    let unverifiedVehicles = [];

    // Extract flash messages from locals (set in app.js global middleware)
    const success_msg = res.locals.success_msg;
    const error_msg = res.locals.error_msg;

    try {
        // 1. Fetch unverified users (excluding admins)
        unverifiedUsers = await User.find({ isVerified: false, role: { $ne: 'admin' } })
            .select('name email govIdFile drivingLicenseFile isVerified createdAt')
            .lean();

        // 2. Fetch unverified vehicles (NEW REQUIREMENT)
        unverifiedVehicles = await Vehicle.find({ isVerified: false })
            .populate('owner', 'name') // Populate owner to show name in the dashboard
            .select('title owner rcFile insuranceFile pollutionFile isVerified')
            .lean();

        // 3. Fetch recent bookings
        recentBookings = await Booking.find()
            .populate('vehicle', 'title owner') 
            .populate('renter', 'name')        
            .limit(20)
            .sort({ createdAt: -1 })
            .lean();

        // Determine which tab to open (from query parameter or default)
        const initialTabId = req.query.tab || 'user-verification'; 

        res.render('admin/dashboard', {
            unverifiedUsers,
            unverifiedVehicles, // Passed to EJS
            recentBookings,
            initialTabId,
            success_msg,
            error_msg
        });
    } catch (err) {
        console.error('Dashboard Data Fetch Error:', err);
        req.flash('error', 'Server Error: Could not load admin data.');
        res.redirect('/admin/dashboard');
    }
});

// --- 1. USER VERIFICATION LOGIC ---

// Approve User
router.post('/admin/approve-user/:userId', isAdmin, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.userId, { isVerified: true });
        req.flash('success_msg', 'User successfully approved and verified.');
        res.redirect('/admin/dashboard?tab=user-verification');
    } catch (err) {
        console.error('Approval Error:', err);
        req.flash('error_msg', 'Could not approve user.');
        res.redirect('/admin/dashboard?tab=user-verification');
    }
});

// Deny User
router.post('/admin/deny-user/:userId', isAdmin, async (req, res) => {
    try {
        // Clear documents and keep isVerified as false
        await User.findByIdAndUpdate(req.params.userId, { 
            isVerified: false,
            govIdFile: undefined, 
            drivingLicenseFile: undefined 
        });
        req.flash('success_msg', 'User verification denied and documents cleared.');
        res.redirect('/admin/dashboard?tab=user-verification');
    } catch (err) {
        console.error('Denial Error:', err);
        req.flash('error_msg', 'Could not deny user.');
        res.redirect('/admin/dashboard?tab=user-verification');
    }
});

// --- 2. VEHICLE VERIFICATION LOGIC ---

// Approve Vehicle
router.post('/admin/approve-vehicle/:vehicleId', isAdmin, async (req, res) => {
    try {
        await Vehicle.findByIdAndUpdate(req.params.vehicleId, { isVerified: true });
        req.flash('success_msg', 'Vehicle successfully approved and listed.');
        res.redirect('/admin/dashboard?tab=vehicle-verification');
    } catch (err) {
        console.error('Vehicle Approval Error:', err);
        req.flash('error_msg', 'Could not approve vehicle.');
        res.redirect('/admin/dashboard?tab=vehicle-verification');
    }
});

// Deny Vehicle
router.post('/admin/deny-vehicle/:vehicleId', isAdmin, async (req, res) => {
    try {
        // Clear document paths and keep isVerified as false
        await Vehicle.findByIdAndUpdate(req.params.vehicleId, { 
            isVerified: false,
            rcFile: undefined, 
            insuranceFile: undefined, 
            pollutionFile: undefined
        });
        req.flash('success_msg', 'Vehicle documents cleared and listing denied.');
        res.redirect('/admin/dashboard?tab=vehicle-verification');
    } catch (err) {
        console.error('Vehicle Denial Error:', err);
        req.flash('error_msg', 'Could not deny vehicle listing.');
        res.redirect('/admin/dashboard?tab=vehicle-verification');
    }
});

// --- 3. PAYOUT MANAGEMENT LOGIC ---

// Process Payout
router.post('/admin/process-payout/:bookingId', isAdmin, async (req, res) => {
    try {
        // Logic for integrating with a payment service provider goes here.
        await Booking.findByIdAndUpdate(req.params.bookingId, { paymentStatus: 'paid' });
        
        req.flash('success_msg', `Payout processed for Booking ${req.params.bookingId}.`);
        res.redirect('/admin/dashboard?tab=payouts');

    } catch (err) {
        console.error('Payout Error:', err);
        req.flash('error_msg', 'Failed to process payout.');
        res.redirect('/admin/dashboard?tab=payouts');
    }
});

module.exports = router;
