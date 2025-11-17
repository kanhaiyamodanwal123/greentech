// controllers/bookingController.js
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

/* =====================================================
    📌 RENTER – View My Bookings
===================================================== */
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ renter: req.user._id })
      .populate({
        path: "vehicle",
        populate: { path: "owner", select: "name email" }
      })
      .sort({ createdAt: -1 })
      .lean();

    res.render("bookings/myBookings", {
      bookings,
      user: req.user,
      success_msg: req.flash("success_msg"),
      error_msg: req.flash("error_msg")
    });

  } catch (err) {
    console.error("GET MY BOOKINGS ERROR:", err);
    req.flash("error_msg", "Unable to load your bookings");
    res.redirect("/");
  }
};

/* =====================================================
    📌 OWNER – View Booking Requests for Their Vehicles
===================================================== */
exports.getOwnerBookings = async (req, res) => {
  try {
    // Get all vehicles owned by user
    const vehicles = await Vehicle.find({ owner: req.user._id }).lean();
    const vehicleIds = vehicles.map(v => v._id);

    // Get bookings belonging to these vehicles
    const bookingRequests = await Booking.find({ vehicle: { $in: vehicleIds } })
      .populate("vehicle")
      .populate("renter", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.render("vehicles/ownerDashboard", {
      vehicles,
      bookingRequests,
      user: req.user
    });

  } catch (err) {
    console.error("OWNER BOOKINGS ERROR:", err);
    req.flash("error_msg", "Error fetching booking requests");
    res.redirect("/vehicles/owner/dashboard");
  }
};

/* =====================================================
    📌 ACCEPT BOOKING (Owner)
===================================================== */
exports.acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("vehicle");

    if (!booking) {
      req.flash("error_msg", "Booking not found");
      return res.redirect("/vehicles/owner/dashboard");
    }

    if (String(booking.vehicle.owner) !== String(req.user._id)) {
      req.flash("error_msg", "Unauthorized action");
      return res.redirect("/vehicles/owner/dashboard");
    }

    booking.status = "accepted";
    booking.ownerResponseAt = new Date();
    await booking.save();

    req.flash("success_msg", "Booking accepted");
    res.redirect("/vehicles/owner/dashboard");

  } catch (err) {
    console.error("ACCEPT BOOKING ERROR:", err);
    req.flash("error_msg", "Failed to accept booking");
    res.redirect("/vehicles/owner/dashboard");
  }
};

/* =====================================================
    📌 REJECT BOOKING (Owner)
===================================================== */
exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("vehicle");

    if (!booking) {
      req.flash("error_msg", "Booking not found");
      return res.redirect("/vehicles/owner/dashboard");
    }

    if (String(booking.vehicle.owner) !== String(req.user._id)) {
      req.flash("error_msg", "Unauthorized action");
      return res.redirect("/vehicles/owner/dashboard");
    }

    booking.status = "rejected";
    booking.ownerResponseAt = new Date();
    await booking.save();

    req.flash("success_msg", "Booking rejected");
    res.redirect("/vehicles/owner/dashboard");

  } catch (err) {
    console.error("REJECT BOOKING ERROR:", err);
    req.flash("error_msg", "Failed to reject booking");
    res.redirect("/vehicles/owner/dashboard");
  }
};

/* =====================================================
    📌 GET CHECKOUT PAGE (Renter)
===================================================== */
exports.getCheckout = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).lean();

    if (!vehicle) {
      req.flash("error_msg", "Vehicle not found");
      return res.redirect("/vehicles");
    }

    res.render("bookings/checkout", {
      vehicle,
      user: req.user
    });

  } catch (err) {
    console.error("CHECKOUT PAGE ERROR:", err);
    req.flash("error_msg", "Error loading checkout page");
    res.redirect("/vehicles");
  }
};

/* =====================================================
    📌 CREATE BOOKING (Renter)
===================================================== */
exports.postCheckout = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      req.flash("error_msg", "Vehicle not found");
      return res.redirect("/vehicles");
    }

    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      req.flash("error_msg", "Please select both dates");
      return res.redirect(`/bookings/checkout/${req.params.id}`);
    }

    const totalDays =
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;

    const booking = new Booking({
      vehicle: vehicle._id,
      renter: req.user._id,
      startDate,
      endDate,
      totalAmount: totalDays * vehicle.pricePerDay,
      status: "pending"
    });

    await booking.save();

    req.flash("success_msg", "Booking request sent!");
    res.redirect("/bookings/my");

  } catch (err) {
    console.error("CREATE BOOKING ERROR:", err);
    req.flash("error_msg", "Failed to create booking");
    res.redirect(`/bookings/checkout/${req.params.id}`);
  }
};

/* =====================================================
    📌 COMPLETE BOOKING (Renter)
===================================================== */
exports.completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      req.flash("error_msg", "Booking not found");
      return res.redirect("/bookings/my");
    }

    if (String(booking.renter) !== String(req.user._id)) {
      req.flash("error_msg", "Unauthorized");
      return res.redirect("/bookings/my");
    }

    const { review, rating } = req.body;

    booking.status = "completed";
    booking.review = review;
    booking.rating = rating;
    booking.completedAt = new Date();

    await booking.save();

    req.flash("success_msg", "Thank you for your feedback!");
    res.redirect("/bookings/my");

  } catch (err) {
    console.error("COMPLETE BOOKING ERROR:", err);
    req.flash("error_msg", "Unable to complete booking");
    res.redirect("/bookings/my");
  }
};
