// routes/bookings.js
const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/bookingController');

const {
  ensureAuthenticated,
  ensureRenter,
  ensureOwner
} = require('../controllers/authController');


/* ===========================
      RENTER ROUTES
=========================== */

// Checkout page
router.get(
  '/checkout/:id',
  ensureAuthenticated,
  ensureRenter,
  bookingController.getCheckout
);

// Submit checkout
router.post(
  '/checkout/:id',
  ensureAuthenticated,
  ensureRenter,
  bookingController.postCheckout
);

// My bookings
router.get(
  '/my',
  ensureAuthenticated,
  ensureRenter,
  bookingController.getMyBookings
);

// Complete booking
router.post(
  '/complete/:id',
  ensureAuthenticated,
  ensureRenter,
  bookingController.completeBooking
);


/* ===========================
      OWNER ROUTES
=========================== */

// View booking requests for OWNER VEHICLES
router.get(
  '/owner/requests',
  ensureAuthenticated,
  ensureOwner,
  bookingController.getOwnerBookings
);

// Accept booking
router.post(
  '/:id/accept',
  ensureAuthenticated,
  ensureOwner,
  bookingController.acceptBooking
);

// Reject booking
router.post(
  '/:id/reject',
  ensureAuthenticated,
  ensureOwner,
  bookingController.rejectBooking
);


module.exports = router;
