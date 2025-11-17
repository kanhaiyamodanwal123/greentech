// routes/index.js
const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

// ---------------------------
// HOME PAGE
// ---------------------------
router.get('/', async (req, res) => {
  try {
    const user = req.user;
    const userRole = user ? (user.role || '').toLowerCase() : null;

    let vehicles = [];
    let bookingRequests = [];

    if (userRole === 'owner') {
      // Owner sees ONLY their own vehicles (verified or not)
      vehicles = await Vehicle.find({ owner: user._id })
        .populate('owner')
        .sort({ createdAt: -1 })
        .limit(12)
        .lean();

      // If owner has vehicles, fetch booking requests
      if (vehicles.length > 0) {
        const vehicleIds = vehicles.map(v => v._id);

        bookingRequests = await Booking.find({
          vehicle: { $in: vehicleIds }
        })
          .populate('vehicle')
          .populate('renter', 'name email')
          .sort({ createdAt: -1 })
          .lean();
      }

    } else {
      // Renters and guests see ONLY verified vehicles
      vehicles = await Vehicle.find({ isVerified: true })
        .populate('owner')
        .sort({ createdAt: -1 })
        .limit(12)
        .lean();
    }

    res.render('index', {
      user,
      vehicles,
      bookingRequests
    });

  } catch (err) {
    console.error('Index Route Error:', err);

    res.render('index', {
      user: req.user,
      vehicles: [],
      bookingRequests: []
    });
  }
});

// ---------------------------
// STATIC PAGES
// ---------------------------
router.get('/about', (req, res) => {
  res.render('aboutus', { user: req.user });
});

router.get('/blogs', (req, res) => {
  res.render('blogs', { user: req.user });
});

router.get('/partner', (req, res) => {
  res.render('partner', { user: req.user });
});

router.get('/subscription', (req, res) => {
  res.render('subscription', { user: req.user });
});


router.get('/terms', (req, res) => {
    res.render('terms', { user: req.user });
});

router.get('/privacy', (req, res) => {
    res.render('privacy', { user: req.user });
});

module.exports = router;
